---
title: Objective-C Method Swizzling 的最佳实践
tags: []
date: 2015-06-14 12:03:32
---

Objective-C 中的 Method Swizzling 是一项**异常**强大的技术，它可以允许我们动态地替换方法的实现，实现 `Hook` 功能，是一种比子类化更加灵活的“重写”方法的方式。

## Method Swizzling 的原理

Method Swizzling 是一把双刃剑，使用得当可以让我们非常轻松地实现复杂的功能，而如果一旦误用，它也很可能会给我们的程序带来毁灭性的伤害。但是我们大可不必惊慌，在了解了它的实现原理后，我们就可以“信手拈来”了。

我们先来了解下 Objective-C 中方法 `Method` 的数据结构：

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
<span class='line-number'>3</span>
<span class='line-number'>4</span>
<span class='line-number'>5</span>
<span class='line-number'>6</span>
<span class='line-number'>7</span>
<span class='line-number'>8</span>
<span class='line-number'>9</span>
<span class='line-number'>10</span>
<span class='line-number'>11</span>
<span class='line-number'>12</span>
<span class='line-number'>13</span>
<span class='line-number'>14</span>
<span class='line-number'>15</span>
</pre></td><td class='code'>

    <span class='line'><span class="k">typedef</span> <span class="k">struct</span> <span class="kt">method_t</span> <span class="o">*</span><span class="n">Method</span><span class="p">;</span>
    </span><span class='line'><span class="k">struct</span> <span class="kt">method_t</span> <span class="p">{</span>
    </span><span class='line'>    <span class="kt">SEL</span> <span class="n">name</span><span class="p">;</span>
    </span><span class='line'>    <span class="k">const</span> <span class="kt">char</span> <span class="o">*</span><span class="n">types</span><span class="p">;</span>
    </span><span class='line'>    <span class="kt">IMP</span> <span class="n">imp</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="k">struct</span> <span class="nl">SortBySELAddress</span> <span class="p">:</span>
    </span><span class='line'>        <span class="n">public</span> <span class="n">std</span><span class="o">::</span><span class="n">binary_function</span><span class="o">&lt;</span><span class="k">const</span> <span class="kt">method_t</span><span class="o">&amp;</span><span class="p">,</span>
    </span><span class='line'>                                    <span class="k">const</span> <span class="kt">method_t</span><span class="o">&amp;</span><span class="p">,</span> <span class="kt">bool</span><span class="o">&gt;</span>
    </span><span class='line'>    <span class="p">{</span>
    </span><span class='line'>        <span class="kt">bool</span> <span class="n">operator</span><span class="p">()</span> <span class="p">(</span><span class="k">const</span> <span class="kt">method_t</span><span class="o">&amp;</span> <span class="n">lhs</span><span class="p">,</span>
    </span><span class='line'>                         <span class="k">const</span> <span class="kt">method_t</span><span class="o">&amp;</span> <span class="n">rhs</span><span class="p">)</span>
    </span><span class='line'>        <span class="p">{</span> <span class="k">return</span> <span class="n">lhs</span><span class="p">.</span><span class="n">name</span> <span class="o">&lt;</span> <span class="n">rhs</span><span class="p">.</span><span class="n">name</span><span class="p">;</span> <span class="p">}</span>
    </span><span class='line'>    <span class="p">};</span>
    </span><span class='line'><span class="p">};</span>
    </span>`</pre></td></tr></table></div></figure>

    本质上，它就是 `struct method_t` 类型的指针，所以我们重点看下结构体 `method_t` 的定义。在结构体 `method_t` 中定义了三个成员变量和一个成员函数：

1.  `name` 表示的是方法的名称，用于唯一标识某个方法，比如 `@selector(viewWillAppear:)` ；
2.  `types` 表示的是方法的返回值和参数类型（详细信息可以查阅苹果官方文档中的 [Type Encodings](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html#//apple_ref/doc/uid/TP40008048-CH100-SW1) ）；
3.  `imp` 是一个函数指针，指向方法的实现；
4.  `SortBySELAddress` 顾名思义，是一个根据 `name` 的地址对方法进行排序的函数。

    由此，我们也可以发现 Objective-C 中的方法名是不包括参数类型的，也就是说下面两个方法在 runtime 看来就是同一个方法：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span><span class="p">;</span>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="bp">NSString</span> <span class="o">*</span><span class="p">)</span><span class="nv">string</span><span class="p">;</span>
    </span>`</pre></td></tr></table></div></figure>

    而下面两个方法却是可以共存的：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span><span class="p">;</span>
    </span><span class='line'><span class="p">+</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span><span class="p">;</span>
    </span>`</pre></td></tr></table></div></figure>

    因为实例方法和类方法是分别保存在类对象和元类对象中的，更多详情可以查看我前面的文章[《Objective-C 对象模型》](http://blog.leichunfeng.com/blog/2015/04/25/objective-c-object-model/)。

    原则上，方法的名称 `name` 和方法的实现 `imp` 是一一对应的，而 Method Swizzling 的原理就是动态地改变它们的对应关系，以达到替换方法实现的目的。

    ## Method Swizzling 有什么用

    说了这么多，到底 Method Swizzling 有什么用呢？表猴急哈，我们接下来看个例子就明白了。用过[友盟](http://www.umeng.com/)统计的同学应该知道，要实现[页面的统计](http://dev.umeng.com/analytics/ios-doc/integration#3)功能，我们需要在每个页面的 `view controller` 中添加如下代码：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    <span class='line-number'>6</span>
    <span class='line-number'>7</span>
    <span class='line-number'>8</span>
    <span class='line-number'>9</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="p">[</span><span class="nb">super</span> <span class="nl">viewWillAppear</span><span class="p">:</span><span class="n">animated</span><span class="p">];</span>
    </span><span class='line'>    <span class="p">[</span><span class="n">MobClick</span> <span class="nl">beginLogPageView</span><span class="p">:</span><span class="s">@&quot;PageOne&quot;</span><span class="p">];</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillDisappear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="p">[</span><span class="nb">super</span> <span class="nl">viewWillDisappear</span><span class="p">:</span><span class="n">animated</span><span class="p">];</span>
    </span><span class='line'>    <span class="p">[</span><span class="n">MobClick</span> <span class="nl">endLogPageView</span><span class="p">:</span><span class="s">@&quot;PageOne&quot;</span><span class="p">];</span>
    </span><span class='line'><span class="p">}</span>
    </span>`</pre></td></tr></table></div></figure>

    要达到这个目的，我们有两种比较常规的实现方式：

1.  直接修改每个页面的 `view controller` 代码，简单粗暴；
2.  子类化 `view controller` ，并让我们的 `view controller` 都继承这些子类。

    第 1 种方式的缺点是不言而喻的，这样做不仅会产生大量重复的代码，而且还很容易遗漏某些页面，非常难维护；第 2 种方式稍微好一点，但是也同样需要我们子类化 `UIViewController` 、`UITableViewController` 和 `UITabBarController` 等不同类型的 `view controller` 。

    也许你跟我一样陷入了思考，难道就没有一种简单优雅的解决方案吗？答案是肯定的，Method Swizzling 就是解决此类问题的最佳方式。

    ## Method Swizzling 的最佳实践

    下面我们就以替换 `viewWillAppear` 方法为例谈谈 Method Swizzling 的最佳实践，话不多说，直接上代码：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    <span class='line-number'>6</span>
    <span class='line-number'>7</span>
    <span class='line-number'>8</span>
    <span class='line-number'>9</span>
    <span class='line-number'>10</span>
    <span class='line-number'>11</span>
    <span class='line-number'>12</span>
    <span class='line-number'>13</span>
    <span class='line-number'>14</span>
    <span class='line-number'>15</span>
    <span class='line-number'>16</span>
    <span class='line-number'>17</span>
    <span class='line-number'>18</span>
    <span class='line-number'>19</span>
    <span class='line-number'>20</span>
    <span class='line-number'>21</span>
    <span class='line-number'>22</span>
    <span class='line-number'>23</span>
    <span class='line-number'>24</span>
    <span class='line-number'>25</span>
    <span class='line-number'>26</span>
    <span class='line-number'>27</span>
    <span class='line-number'>28</span>
    <span class='line-number'>29</span>
    <span class='line-number'>30</span>
    <span class='line-number'>31</span>
    <span class='line-number'>32</span>
    <span class='line-number'>33</span>
    <span class='line-number'>34</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="k">@interface</span> <span class="bp">UIViewController</span> <span class="nl">(MRCUMAnalytics)</span>
    </span><span class='line'>
    </span><span class='line'><span class="k">@end</span>
    </span><span class='line'>
    </span><span class='line'><span class="k">@implementation</span> <span class="bp">UIViewController</span> <span class="nl">(MRCUMAnalytics)</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">+</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">load</span> <span class="p">{</span>
    </span><span class='line'>    <span class="k">static</span> <span class="kt">dispatch_once_t</span> <span class="n">onceToken</span><span class="p">;</span>
    </span><span class='line'>    <span class="n">dispatch_once</span><span class="p">(</span><span class="o">&amp;</span><span class="n">onceToken</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    </span><span class='line'>        <span class="kt">Class</span> <span class="k">class</span> <span class="o">=</span> <span class="p">[</span><span class="nb">self</span> <span class="k">class</span><span class="p">];</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="kt">SEL</span> <span class="n">originalSelector</span> <span class="o">=</span> <span class="k">@selector</span><span class="p">(</span><span class="nl">viewWillAppear</span><span class="p">:);</span>
    </span><span class='line'>        <span class="kt">SEL</span> <span class="n">swizzledSelector</span> <span class="o">=</span> <span class="k">@selector</span><span class="p">(</span><span class="nl">mrc_viewWillAppear</span><span class="p">:);</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="n">Method</span> <span class="n">originalMethod</span> <span class="o">=</span> <span class="n">class_getInstanceMethod</span><span class="p">(</span><span class="k">class</span><span class="p">,</span> <span class="n">originalSelector</span><span class="p">);</span>
    </span><span class='line'>        <span class="n">Method</span> <span class="n">swizzledMethod</span> <span class="o">=</span> <span class="n">class_getInstanceMethod</span><span class="p">(</span><span class="k">class</span><span class="p">,</span> <span class="n">swizzledSelector</span><span class="p">);</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="kt">BOOL</span> <span class="n">success</span> <span class="o">=</span> <span class="n">class_addMethod</span><span class="p">(</span><span class="k">class</span><span class="p">,</span> <span class="n">originalSelector</span><span class="p">,</span> <span class="n">method_getImplementation</span><span class="p">(</span><span class="n">swizzledMethod</span><span class="p">),</span> <span class="n">method_getTypeEncoding</span><span class="p">(</span><span class="n">swizzledMethod</span><span class="p">));</span>
    </span><span class='line'>        <span class="k">if</span> <span class="p">(</span><span class="n">success</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>            <span class="n">class_replaceMethod</span><span class="p">(</span><span class="k">class</span><span class="p">,</span> <span class="n">swizzledSelector</span><span class="p">,</span> <span class="n">method_getImplementation</span><span class="p">(</span><span class="n">originalMethod</span><span class="p">),</span> <span class="n">method_getTypeEncoding</span><span class="p">(</span><span class="n">originalMethod</span><span class="p">));</span>
    </span><span class='line'>        <span class="p">}</span> <span class="k">else</span> <span class="p">{</span>
    </span><span class='line'>            <span class="n">method_exchangeImplementations</span><span class="p">(</span><span class="n">originalMethod</span><span class="p">,</span> <span class="n">swizzledMethod</span><span class="p">);</span>
    </span><span class='line'>        <span class="p">}</span>
    </span><span class='line'>    <span class="p">});</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="cp">#pragma mark - Method Swizzling</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">mrc_viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="p">[</span><span class="nb">self</span> <span class="nl">mrc_viewWillAppear</span><span class="p">:</span><span class="n">animated</span><span class="p">];</span>
    </span><span class='line'>    <span class="p">[</span><span class="n">MobClick</span> <span class="nl">beginLogPageView</span><span class="p">:</span><span class="n">NSStringFromClass</span><span class="p">([</span><span class="nb">self</span> <span class="k">class</span><span class="p">])];</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="k">@end</span>
    </span>`</pre></td></tr></table></div></figure>

    **解析**：在上面的代码中有三个关键点需要引起我们的注意：

1.  为什么是在 `+load` 方法中实现 Method Swizzling 的逻辑，而不是其他的什么方法，比如 `+initialize` 等；
2.  为什么 Method Swizzling 的逻辑需要用 dispatch_once 来进行调度；
3.  为什么需要调用 `class_addMethod` 方法，并且以它的结果为依据分别处理两种不同的情况。

    下面我们就一起来分析下这三个为什么到底是为了什么？

    **第 1 个为什么**：看过我前面文章[《Objective-C +load vs +initialize》](http://blog.leichunfeng.com/blog/2015/05/02/objective-c-plus-load-vs-plus-initialize/) 的同学应该知道，`+load` 和 `+initialize` 是 Objective-C runtime 会自动调用的两个类方法。但是它们被调用的时机却是有差别的，`+load` 方法是在类被加载的时候调用的，而 `+initialize` 方法是在类或它的子类收到第一条消息之前被调用的，这里所指的消息包括实例方法和类方法的调用。也就是说 `+initialize` 方法是以懒加载的方式被调用的，如果程序一直没有给某个类或它的子类发送消息，那么这个类的 `+initialize` 方法是永远不会被调用的。此外 `+load` 方法还有一个非常重要的特性，那就是子类、父类和分类中的 `+load` 方法的实现是被区别对待的。换句话说在 Objective-C runtime 自动调用 `+load` 方法时，分类中的 `+load` 方法并不会对主类中的 `+load` 方法造成覆盖。综上所述，`+load` 方法是实现 Method Swizzling 逻辑的最佳“场所”。

    **第 2 个为什么**：我们上面提到，`+load` 方法在类加载的时候会被 runtime 自动调用一次，但是它并没有限制程序员对 `+load` 方法的手动调用。什么？你说不会有程序员这么干？那可说不定，我还见过手动调用 `viewDidLoad` 方法的程序员，就是介么任性。而我们所能够做的就是尽可能地保证程序能够在各种情况下正常运行。

    **第 3 个为什么**：我们使用 Method Swizzling 的目的通常都是为了给程序增加功能，而不是完全地替换某个功能，所以我们一般都需要在自定义的实现中调用原始的实现。所以这里就会有两种情况需要我们分别进行处理：

    **第 1 种情况**：主类本身有实现需要替换的方法，也就是 `class_addMethod` 方法返回 `NO` 。这种情况的处理比较简单，直接交换两个方法的实现就可以了：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    <span class='line-number'>6</span>
    <span class='line-number'>7</span>
    <span class='line-number'>8</span>
    <span class='line-number'>9</span>
    <span class='line-number'>10</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="c1">/// 先调用原始实现，由于主类本身有实现该方法，所以这里实际调用的是主类的实现</span>
    </span><span class='line'>    <span class="p">[</span><span class="nb">self</span> <span class="nl">mrc_viewWillAppear</span><span class="p">:</span><span class="n">animated</span><span class="p">];</span>
    </span><span class='line'>    <span class="c1">/// 我们增加的功能</span>
    </span><span class='line'>    <span class="p">[</span><span class="n">MobClick</span> <span class="nl">beginLogPageView</span><span class="p">:</span><span class="n">NSStringFromClass</span><span class="p">([</span><span class="nb">self</span> <span class="k">class</span><span class="p">])];</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">mrc_viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="c1">/// 主类的实现</span>
    </span><span class='line'><span class="p">}</span>
    </span>`</pre></td></tr></table></div></figure>

    **第 2 种情况**：主类本身没有实现需要替换的方法，而是继承了父类的实现，即 `class_addMethod` 方法返回 `YES` 。这时使用 `class_getInstanceMethod` 函数获取到的 `originalSelector` 指向的就是父类的方法，我们再通过执行 `class_replaceMethod(class, swizzledSelector, method_getImplementation(originalMethod), method_getTypeEncoding(originalMethod));` 将父类的实现替换到我们自定义的 `mrc_viewWillAppear` 方法中。这样就达到了在 `mrc_viewWillAppear` 方法的实现中调用父类实现的目的。

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    <span class='line-number'>6</span>
    <span class='line-number'>7</span>
    <span class='line-number'>8</span>
    <span class='line-number'>9</span>
    <span class='line-number'>10</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="c1">/// 先调用原始实现，由于主类本身并没有实现该方法，所以这里实际调用的是父类的实现</span>
    </span><span class='line'>    <span class="p">[</span><span class="nb">self</span> <span class="nl">mrc_viewWillAppear</span><span class="p">:</span><span class="n">animated</span><span class="p">];</span>
    </span><span class='line'>    <span class="c1">/// 我们增加的功能</span>
    </span><span class='line'>    <span class="p">[</span><span class="n">MobClick</span> <span class="nl">beginLogPageView</span><span class="p">:</span><span class="n">NSStringFromClass</span><span class="p">([</span><span class="nb">self</span> <span class="k">class</span><span class="p">])];</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">mrc_viewWillAppear:</span><span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nv">animated</span> <span class="p">{</span>
    </span><span class='line'>    <span class="c1">/// 父类的实现</span>
    </span><span class='line'><span class="p">}</span>
    </span>
</td></tr></table></div></figure>

看到这里，相信你对 Method Swizzling 已经有了一定的了解，那么接下来就请你自己亲自试一试吧，you should give it a try yourself 。

## 总结

Method Swizzling 是一种黑魔法，我们在使用它时需要加倍小心，而遵循本文的最佳实践可以让你事半功倍。

## 参考链接

[http://nshipster.com/method-swizzling/](http://nshipster.com/method-swizzling/)

[https://www.mikeash.com/pyblog/friday-qa-2010-01-29-method-replacement-for-fun-and-profit.html](https://www.mikeash.com/pyblog/friday-qa-2010-01-29-method-replacement-for-fun-and-profit.html)