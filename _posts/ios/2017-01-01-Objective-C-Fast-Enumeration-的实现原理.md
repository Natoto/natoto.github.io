---
title: Objective-C Fast Enumeration 的实现原理
tags: []
date: 2016-06-20 20:30:53
---

在 Objective-C 2.0 中提供了快速枚举的语法，它是我们遍历集合元素的首选方法，因为它具有以下优点：

*   比直接使用 `NSEnumerator` 更高效；
*   语法非常简洁；
*   如果集合在遍历的过程中被修改，它会抛出异常；
*   可以同时执行多个枚举。

那么问题来了，它是如何做到的呢？我想，你应该也跟我一样，对 Objective-C 中快速枚举的实现原理非常感兴趣，事不宜迟，让我们来一探究竟吧。

## 解析 NSFastEnumeration 协议

在 Objective-C 中，我们要想实现快速枚举就必须要实现 [NSFastEnumeration](https://developer.apple.com/library/mac/#documentation/Cocoa/Reference/NSFastEnumeration_protocol/Reference/NSFastEnumeration.html) 协议，在这个协议中，只声明了一个必须实现的方法：

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
</pre></td><td class='code'>

    <span class='line'><span class="cm">/**</span>
    </span><span class='line'><span class="cm"> Returns by reference a C array of objects over which the sender should iterate, and as the return value the number of objects in the array.</span>
    </span><span class='line'>
    </span><span class='line'><span class="cm"> @param state  Context information that is used in the enumeration to, in addition to other possibilities, ensure that the collection has not been mutated.</span>
    </span><span class='line'><span class="cm"> @param buffer A C array of objects over which the sender is to iterate.</span>
    </span><span class='line'><span class="cm"> @param len    The maximum number of objects to return in stackbuf.</span>
    </span><span class='line'><span class="cm"> </span>
    </span><span class='line'><span class="cm"> @discussion The state structure is assumed to be of stack local memory, so you can recast the passed in state structure to one more suitable for your iteration.</span>
    </span><span class='line'>
    </span><span class='line'><span class="cm"> @return The number of objects returned in stackbuf. Returns 0 when the iteration is finished.</span>
    </span><span class='line'><span class="cm"> */</span>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="bp">NSUInteger</span><span class="p">)</span><span class="nf">countByEnumeratingWithState:</span><span class="p">(</span><span class="n">NSFastEnumerationState</span> <span class="o">*</span><span class="p">)</span><span class="nv">state</span>
    </span><span class='line'>                                  <span class="nf">objects:</span><span class="p">(</span><span class="kt">id</span> <span class="n">__unsafe_unretained</span> <span class="p">[])</span><span class="nv">stackbuf</span>
    </span><span class='line'>                                    <span class="nf">count:</span><span class="p">(</span><span class="bp">NSUInteger</span><span class="p">)</span><span class="nv">len</span>
    </span>`</pre></td></tr></table></div></figure>

    其中，结构体 `NSFastEnumerationState` 的定义如下：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    <span class='line-number'>6</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="k">typedef</span> <span class="k">struct</span> <span class="p">{</span>
    </span><span class='line'>    <span class="kt">unsigned</span> <span class="kt">long</span> <span class="n">state</span><span class="p">;</span>
    </span><span class='line'>    <span class="kt">id</span> <span class="n">__unsafe_unretained</span> <span class="n">__nullable</span> <span class="o">*</span> <span class="n">__nullable</span> <span class="n">itemsPtr</span><span class="p">;</span>
    </span><span class='line'>    <span class="kt">unsigned</span> <span class="kt">long</span> <span class="o">*</span> <span class="n">__nullable</span> <span class="n">mutationsPtr</span><span class="p">;</span>
    </span><span class='line'>    <span class="kt">unsigned</span> <span class="kt">long</span> <span class="n">extra</span><span class="p">[</span><span class="mi">5</span><span class="p">];</span>
    </span><span class='line'><span class="p">}</span> <span class="n">NSFastEnumerationState</span><span class="p">;</span>
    </span>`</pre></td></tr></table></div></figure>

    说实话，刚开始看到这个方法的时候，其实我是拒绝的，原因你懂的。好吧，先不吐槽了，言归正传，下面，我们将对这个方法进行全方位的剖析：

    首先，我们需要了解的最重要的一点，那就是这个方法的目的是什么？概括地说，这个方法就是用于返回一系列的 C 数组，以供调用者进行遍历。为什么是一系列的 C 数组呢？因为，在一个 `for/in` 循环中，这个方法其实会被调用多次，每一次调用都会返回一个 C 数组。至于为什么是 C 数组，那当然是为了提高效率了。

    既然要返回 C 数组，也就意味着我们需要返回一个数组的指针和数组的长度。是的，我想你应该已经猜到了，数组的长度就是通过这个方法的返回值来提供的，而数组的指针则是通过结构体 `NSFastEnumerationState` 的 `itemsPtr` 字段进行返回的。所以，这两个值就一起定义了这个方法返回的 C 数组。

    通常来说，`NSFastEnumeration` 允许我们直接返回一个指向内部存储的指针，但是并非所有的数据结构都能够满足内存连续的要求。因此，`NSFastEnumeration` 还为我们提供了另外一种实现方案，我们可以将元素拷贝到调用者提供的一个 C 数组上，即 `stackbuf` ，它的长度由参数 `len` 指定。

    在本文的开头，我们提到了如果集合在遍历的过程中被修改的话，`NSFastEnumeration` 就会抛出异常。而这个功能就是通过 `mutationsPtr` 字段来实现的，它指向一个这样的值，这个值在集合被修改时会发现改变。因此，我们就可以利用它来判断集合在遍历的过程中是否被修改。

    现在，我们还剩下 `NSFastEnumerationState` 中的 `state` 和 `extra` 字段没有进行介绍。实际上，它们是调用者提供给被调用者自由使用的两个字段，调用者根本不关心这两个字段的值。因此，我们可以利用它们来存储任何对自身有用的值。

    ## 揭密快速枚举的内部实现

    说了这么多，感觉好像 `NSFastEnumeration` 是你设计的一样，你到底是怎么知道的呢？额，我说我是瞎猜的，你信么？好了，不开玩笑了。接下来，我们就一起来探究一下快速枚举的内部实现。假设，我们有一个 `main.m` 文件，其中的代码如下：

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
    </pre></td><td class='code'><pre>`<span class='line'><span class="cp">#import &lt;Foundation/Foundation.h&gt;</span>
    </span><span class='line'>
    </span><span class='line'><span class="kt">int</span> <span class="nf">main</span><span class="p">(</span><span class="kt">int</span> <span class="n">argc</span><span class="p">,</span> <span class="kt">char</span> <span class="o">*</span> <span class="n">argv</span><span class="p">[])</span> <span class="p">{</span>
    </span><span class='line'>    <span class="bp">NSArray</span> <span class="o">*</span><span class="n">array</span> <span class="o">=</span> <span class="l">@[</span> <span class="mi">@1</span><span class="p">,</span> <span class="mi">@2</span><span class="p">,</span> <span class="mi">@3</span> <span class="l">]</span><span class="p">;</span>
    </span><span class='line'>    <span class="k">for</span> <span class="p">(</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="n">number</span> <span class="k">in</span> <span class="n">array</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>        <span class="k">if</span> <span class="p">([</span><span class="n">number</span> <span class="nl">isEqualToNumber</span><span class="p">:</span><span class="mi">@1</span><span class="p">])</span> <span class="p">{</span>
    </span><span class='line'>            <span class="k">continue</span><span class="p">;</span>
    </span><span class='line'>        <span class="p">}</span>
    </span><span class='line'>        <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;%@&quot;</span><span class="p">,</span> <span class="n">number</span><span class="p">);</span>
    </span><span class='line'>        <span class="k">break</span><span class="p">;</span>
    </span><span class='line'>    <span class="p">}</span>
    </span><span class='line'><span class="p">}</span>
    </span>`</pre></td></tr></table></div></figure>

    接着，我们使用下面的 clang 命令将 `main.m` 文件重写成 C++ 代码：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="n">clang</span> <span class="o">-</span><span class="n">rewrite</span><span class="o">-</span><span class="n">objc</span> <span class="n">main</span><span class="p">.</span><span class="n">m</span>
    </span>`</pre></td></tr></table></div></figure>

    得到 `main.cpp` 文件，其中 `main` 函数的代码如下：

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
    <span class='line-number'>35</span>
    <span class='line-number'>36</span>
    <span class='line-number'>37</span>
    <span class='line-number'>38</span>
    <span class='line-number'>39</span>
    <span class='line-number'>40</span>
    <span class='line-number'>41</span>
    <span class='line-number'>42</span>
    <span class='line-number'>43</span>
    <span class='line-number'>44</span>
    <span class='line-number'>45</span>
    <span class='line-number'>46</span>
    <span class='line-number'>47</span>
    <span class='line-number'>48</span>
    <span class='line-number'>49</span>
    <span class='line-number'>50</span>
    <span class='line-number'>51</span>
    <span class='line-number'>52</span>
    <span class='line-number'>53</span>
    <span class='line-number'>54</span>
    <span class='line-number'>55</span>
    <span class='line-number'>56</span>
    <span class='line-number'>57</span>
    <span class='line-number'>58</span>
    <span class='line-number'>59</span>
    <span class='line-number'>60</span>
    <span class='line-number'>61</span>
    <span class='line-number'>62</span>
    <span class='line-number'>63</span>
    <span class='line-number'>64</span>
    <span class='line-number'>65</span>
    <span class='line-number'>66</span>
    <span class='line-number'>67</span>
    <span class='line-number'>68</span>
    <span class='line-number'>69</span>
    <span class='line-number'>70</span>
    <span class='line-number'>71</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="kt">int</span> <span class="nf">main</span><span class="p">(</span><span class="kt">int</span> <span class="n">argc</span><span class="p">,</span> <span class="kt">char</span> <span class="o">*</span> <span class="n">argv</span><span class="p">[])</span> <span class="p">{</span>
    </span><span class='line'>    <span class="c1">// 创建数组 @[ @1, @2, @3 ]</span>
    </span><span class='line'>    <span class="bp">NSArray</span> <span class="o">*</span><span class="n">array</span> <span class="o">=</span> <span class="p">((</span><span class="bp">NSArray</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="p">)(</span><span class="kt">Class</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="k">const</span> <span class="n">ObjectType</span> <span class="o">*</span><span class="p">,</span> <span class="bp">NSUInteger</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)(</span><span class="n">objc_getClass</span><span class="p">(</span><span class="s">&quot;NSArray&quot;</span><span class="p">),</span> <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;arrayWithObjects:count:&quot;</span><span class="p">),</span> <span class="p">(</span><span class="k">const</span> <span class="kt">id</span> <span class="o">*</span><span class="p">)</span><span class="n">__NSContainer_literal</span><span class="p">(</span><span class="mi">3U</span><span class="p">,</span> <span class="p">((</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="p">)(</span><span class="kt">Class</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="kt">int</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)(</span><span class="n">objc_getClass</span><span class="p">(</span><span class="s">&quot;NSNumber&quot;</span><span class="p">),</span> <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;numberWithInt:&quot;</span><span class="p">),</span> <span class="mi">1</span><span class="p">),</span> <span class="p">((</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="p">)(</span><span class="kt">Class</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="kt">int</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)(</span><span class="n">objc_getClass</span><span class="p">(</span><span class="s">&quot;NSNumber&quot;</span><span class="p">),</span> <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;numberWithInt:&quot;</span><span class="p">),</span> <span class="mi">2</span><span class="p">),</span> <span class="p">((</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="p">)(</span><span class="kt">Class</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="kt">int</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)(</span><span class="n">objc_getClass</span><span class="p">(</span><span class="s">&quot;NSNumber&quot;</span><span class="p">),</span> <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;numberWithInt:&quot;</span><span class="p">),</span> <span class="mi">3</span><span class="p">)).</span><span class="n">arr</span><span class="p">,</span> <span class="mi">3U</span><span class="p">);</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="p">{</span>
    </span><span class='line'>        <span class="bp">NSNumber</span> <span class="o">*</span> <span class="n">number</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="c1">// 初始化结构体 NSFastEnumerationState</span>
    </span><span class='line'>        <span class="k">struct</span> <span class="n">__objcFastEnumerationState</span> <span class="n">enumState</span> <span class="o">=</span> <span class="p">{</span> <span class="mi">0</span> <span class="p">};</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="c1">// 初始化数组 stackbuf</span>
    </span><span class='line'>        <span class="kt">id</span> <span class="n">__rw_items</span><span class="p">[</span><span class="mi">16</span><span class="p">];</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="kt">id</span> <span class="n">l_collection</span> <span class="o">=</span> <span class="p">(</span><span class="kt">id</span><span class="p">)</span> <span class="n">array</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="c1">// 第一次调用 - countByEnumeratingWithState:objects:count: 方法，形参和实参的对应关系如下：</span>
    </span><span class='line'>        <span class="c1">// state -&gt; &amp;enumState</span>
    </span><span class='line'>        <span class="c1">// stackbuf -&gt; __rw_items</span>
    </span><span class='line'>        <span class="c1">// len -&gt; 16</span>
    </span><span class='line'>        <span class="n">_WIN_NSUInteger</span> <span class="n">limit</span> <span class="o">=</span>
    </span><span class='line'>            <span class="p">((</span><span class="n">_WIN_NSUInteger</span> <span class="p">(</span><span class="o">*</span><span class="p">)</span> <span class="p">(</span><span class="kt">id</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="k">struct</span> <span class="n">__objcFastEnumerationState</span> <span class="o">*</span><span class="p">,</span> <span class="kt">id</span> <span class="o">*</span><span class="p">,</span> <span class="n">_WIN_NSUInteger</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)</span>
    </span><span class='line'>            <span class="p">((</span><span class="kt">id</span><span class="p">)</span><span class="n">l_collection</span><span class="p">,</span>
    </span><span class='line'>            <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;countByEnumeratingWithState:objects:count:&quot;</span><span class="p">),</span>
    </span><span class='line'>            <span class="o">&amp;</span><span class="n">enumState</span><span class="p">,</span> <span class="p">(</span><span class="kt">id</span> <span class="o">*</span><span class="p">)</span><span class="n">__rw_items</span><span class="p">,</span> <span class="p">(</span><span class="n">_WIN_NSUInteger</span><span class="p">)</span><span class="mi">16</span><span class="p">);</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="k">if</span> <span class="p">(</span><span class="n">limit</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>            <span class="c1">// 获取 mutationsPtr 的初始值</span>
    </span><span class='line'>            <span class="kt">unsigned</span> <span class="kt">long</span> <span class="n">startMutations</span> <span class="o">=</span> <span class="o">*</span><span class="n">enumState</span><span class="p">.</span><span class="n">mutationsPtr</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>            <span class="c1">// 外层的 do/while 循环，用于调用 - countByEnumeratingWithState:objects:count: 方法，获取 C 数组</span>
    </span><span class='line'>            <span class="k">do</span> <span class="p">{</span>
    </span><span class='line'>                <span class="kt">unsigned</span> <span class="kt">long</span> <span class="n">counter</span> <span class="o">=</span> <span class="mi">0</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>                <span class="c1">// 内层的 do/while 循环，用于遍历获取到的 C 数组</span>
    </span><span class='line'>                <span class="k">do</span> <span class="p">{</span>
    </span><span class='line'>                    <span class="c1">// 判断 mutationsPtr 的值是否有发生变化，如果有则使用 objc_enumerationMutation 函数抛出异常</span>
    </span><span class='line'>                    <span class="k">if</span> <span class="p">(</span><span class="n">startMutations</span> <span class="o">!=</span> <span class="o">*</span><span class="n">enumState</span><span class="p">.</span><span class="n">mutationsPtr</span><span class="p">)</span> <span class="n">objc_enumerationMutation</span><span class="p">(</span><span class="n">l_collection</span><span class="p">);</span>
    </span><span class='line'>
    </span><span class='line'>                    <span class="c1">// 使用指针的算术运算获取相应的集合元素，这是快速枚举之所以高效的关键所在</span>
    </span><span class='line'>                    <span class="n">number</span> <span class="o">=</span> <span class="p">(</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">)</span><span class="n">enumState</span><span class="p">.</span><span class="n">itemsPtr</span><span class="p">[</span><span class="n">counter</span><span class="o">++</span><span class="p">];</span>
    </span><span class='line'>
    </span><span class='line'>                    <span class="p">{</span>
    </span><span class='line'>                        <span class="k">if</span> <span class="p">(((</span><span class="kt">BOOL</span> <span class="p">(</span><span class="o">*</span><span class="p">)(</span><span class="kt">id</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="bp">NSNumber</span> <span class="o">*</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)((</span><span class="kt">id</span><span class="p">)</span><span class="n">number</span><span class="p">,</span> <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;isEqualToNumber:&quot;</span><span class="p">),</span> <span class="p">((</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="p">)(</span><span class="kt">Class</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="kt">int</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)(</span><span class="n">objc_getClass</span><span class="p">(</span><span class="s">&quot;NSNumber&quot;</span><span class="p">),</span> <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;numberWithInt:&quot;</span><span class="p">),</span> <span class="mi">1</span><span class="p">)))</span> <span class="p">{</span>
    </span><span class='line'>                            <span class="c1">// continue 语句的实现，使用 goto 语句无条件转移到内层 do 语句的末尾，跳过中间的所有代码</span>
    </span><span class='line'>                            <span class="k">goto</span> <span class="n">__continue_label_1</span><span class="p">;</span>
    </span><span class='line'>                        <span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'>                        <span class="n">NSLog</span><span class="p">((</span><span class="bp">NSString</span> <span class="o">*</span><span class="p">)</span><span class="o">&amp;</span><span class="n">__NSConstantStringImpl__var_folders_cr_xxw2w3rd5_n493ggz9_l4bcw0000gn_T_main_fc7b79_mi_0</span><span class="p">,</span> <span class="n">number</span><span class="p">);</span>
    </span><span class='line'>
    </span><span class='line'>                        <span class="c1">// break 语句的实现，使用 goto 语句无条件转移到最外层 if 语句的末尾，跳出嵌套的两层循环</span>
    </span><span class='line'>                        <span class="k">goto</span> <span class="n">__break_label_1</span><span class="p">;</span>
    </span><span class='line'>                    <span class="p">};</span>
    </span><span class='line'>
    </span><span class='line'>                    <span class="c1">// goto 语句标号，用来实现 continue 语句</span>
    </span><span class='line'>                    <span class="nl">__continue_label_1</span><span class="p">:</span> <span class="p">;</span>
    </span><span class='line'>                <span class="p">}</span> <span class="k">while</span> <span class="p">(</span><span class="n">counter</span> <span class="o">&lt;</span> <span class="n">limit</span><span class="p">);</span>
    </span><span class='line'>            <span class="p">}</span> <span class="k">while</span> <span class="p">((</span><span class="n">limit</span> <span class="o">=</span>
    </span><span class='line'>                <span class="p">((</span><span class="n">_WIN_NSUInteger</span> <span class="p">(</span><span class="o">*</span><span class="p">)</span> <span class="p">(</span><span class="kt">id</span><span class="p">,</span> <span class="kt">SEL</span><span class="p">,</span> <span class="k">struct</span> <span class="n">__objcFastEnumerationState</span> <span class="o">*</span><span class="p">,</span> <span class="kt">id</span> <span class="o">*</span><span class="p">,</span> <span class="n">_WIN_NSUInteger</span><span class="p">))(</span><span class="kt">void</span> <span class="o">*</span><span class="p">)</span><span class="n">objc_msgSend</span><span class="p">)</span>
    </span><span class='line'>                <span class="p">((</span><span class="kt">id</span><span class="p">)</span><span class="n">l_collection</span><span class="p">,</span>
    </span><span class='line'>                <span class="n">sel_registerName</span><span class="p">(</span><span class="s">&quot;countByEnumeratingWithState:objects:count:&quot;</span><span class="p">),</span>
    </span><span class='line'>                <span class="o">&amp;</span><span class="n">enumState</span><span class="p">,</span> <span class="p">(</span><span class="kt">id</span> <span class="o">*</span><span class="p">)</span><span class="n">__rw_items</span><span class="p">,</span> <span class="p">(</span><span class="n">_WIN_NSUInteger</span><span class="p">)</span><span class="mi">16</span><span class="p">)));</span>
    </span><span class='line'>
    </span><span class='line'>            <span class="n">number</span> <span class="o">=</span> <span class="p">((</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">)</span><span class="mi">0</span><span class="p">);</span>
    </span><span class='line'>
    </span><span class='line'>            <span class="c1">// goto 语句标号，用来实现 break 语句</span>
    </span><span class='line'>            <span class="nl">__break_label_1</span><span class="p">:</span> <span class="p">;</span>
    </span><span class='line'>        <span class="p">}</span> <span class="k">else</span> <span class="p">{</span>
    </span><span class='line'>            <span class="n">number</span> <span class="o">=</span> <span class="p">((</span><span class="bp">NSNumber</span> <span class="o">*</span><span class="p">)</span><span class="mi">0</span><span class="p">);</span>
    </span><span class='line'>        <span class="p">}</span>
    </span><span class='line'>    <span class="p">}</span>
    </span><span class='line'><span class="p">}</span>
    </span>`</pre></td></tr></table></div></figure>

    如上代码所示，快速枚举其实就是用两层 `do/while` 循环来实现的，外层循环负责调用 `- countByEnumeratingWithState:objects:count:` 方法，获取 C 数组，而内层循环则负责遍历获取到的 C 数组。同时，我想你应该也注意到了它是如何利用 `mutationsPtr` 来检测集合在遍历过程中的突变的，以及使用 [objc_enumerationMutation](https://developer.apple.com/reference/objectivec/1418744-objc_enumerationmutation?language=objc) 函数来抛出异常。

    正如我们前面提到的，在快速枚举的实现中，确实没有用到结构体 `NSFastEnumerationState` 中的 `state` 和 `extra` 字段，它们只是提供给 `- countByEnumeratingWithState:objects:count:` 方法的实现者自由使用的字段。

    值得一提的是，我特意在 `main.m` 中加入了 `continue` 和 `break` 语句。因此，我们有机会看到了在 `for/in` 语句中是如何利用 goto 来实现 `continue` 和 `break` 语句的。

    ## 实现 NSFastEnumeration 协议

    看到这里，我相信你对 Objective-C 中快速枚举的实现原理已经有了一个比较清晰地认识。下面，我们就一起来动手实现一下 `NSFastEnumeration` 协议。

    我们前面已经提到了，`NSFastEnumeration` 在设计上允许我们使用两种不同的方式来实现它。如果集合中的元素在内存上是连续的，那么我们可以直接返回这段内存的首地址；如果不连续，比如链表，就只能使用调用者提供的 C 数组 `stackbuf` 了，将我们的元素拷贝到这个 C 数组上。

    接下来，我们将通过一个自定义的集合类 `Array` ，来演示这两种不同的实现 `NSFastEnumeration` 协议的方式。**注**：完整的项目代码可以在[这里](https://github.com/leichunfeng/FastEnumerationSample)找到。

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
    <span class='line-number'>35</span>
    <span class='line-number'>36</span>
    <span class='line-number'>37</span>
    <span class='line-number'>38</span>
    <span class='line-number'>39</span>
    <span class='line-number'>40</span>
    <span class='line-number'>41</span>
    <span class='line-number'>42</span>
    <span class='line-number'>43</span>
    <span class='line-number'>44</span>
    <span class='line-number'>45</span>
    <span class='line-number'>46</span>
    <span class='line-number'>47</span>
    <span class='line-number'>48</span>
    <span class='line-number'>49</span>
    <span class='line-number'>50</span>
    <span class='line-number'>51</span>
    <span class='line-number'>52</span>
    <span class='line-number'>53</span>
    <span class='line-number'>54</span>
    <span class='line-number'>55</span>
    <span class='line-number'>56</span>
    <span class='line-number'>57</span>
    <span class='line-number'>58</span>
    <span class='line-number'>59</span>
    <span class='line-number'>60</span>
    <span class='line-number'>61</span>
    <span class='line-number'>62</span>
    <span class='line-number'>63</span>
    <span class='line-number'>64</span>
    <span class='line-number'>65</span>
    <span class='line-number'>66</span>
    <span class='line-number'>67</span>
    <span class='line-number'>68</span>
    <span class='line-number'>69</span>
    <span class='line-number'>70</span>
    <span class='line-number'>71</span>
    <span class='line-number'>72</span>
    <span class='line-number'>73</span>
    <span class='line-number'>74</span>
    <span class='line-number'>75</span>
    <span class='line-number'>76</span>
    <span class='line-number'>77</span>
    <span class='line-number'>78</span>
    <span class='line-number'>79</span>
    <span class='line-number'>80</span>
    <span class='line-number'>81</span>
    <span class='line-number'>82</span>
    <span class='line-number'>83</span>
    <span class='line-number'>84</span>
    <span class='line-number'>85</span>
    <span class='line-number'>86</span>
    <span class='line-number'>87</span>
    <span class='line-number'>88</span>
    <span class='line-number'>89</span>
    <span class='line-number'>90</span>
    <span class='line-number'>91</span>
    <span class='line-number'>92</span>
    <span class='line-number'>93</span>
    <span class='line-number'>94</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="k">@interface</span> <span class="nc">Array</span> : <span class="bp">NSObject</span> <span class="o">&lt;</span><span class="bp">NSFastEnumeration</span><span class="o">&gt;</span>
    </span><span class='line'>
    </span><span class='line'><span class="o">-</span> <span class="p">(</span><span class="kt">instancetype</span><span class="p">)</span><span class="nl">initWithCapacity</span><span class="p">:(</span><span class="bp">NSUInteger</span><span class="p">)</span><span class="n">numItems</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'><span class="k">@end</span>
    </span><span class='line'>
    </span><span class='line'><span class="k">@implementation</span> <span class="nc">Array</span> <span class="p">{</span>
    </span><span class='line'>    <span class="n">std</span><span class="o">::</span><span class="n">vector</span><span class="o">&lt;</span><span class="bp">NSNumber</span> <span class="o">*&gt;</span> <span class="n">_list</span><span class="p">;</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="kt">instancetype</span><span class="p">)</span><span class="nf">initWithCapacity:</span><span class="p">(</span><span class="bp">NSUInteger</span><span class="p">)</span><span class="nv">numItems</span> <span class="p">{</span>
    </span><span class='line'>    <span class="nb">self</span> <span class="o">=</span> <span class="p">[</span><span class="nb">super</span> <span class="n">init</span><span class="p">];</span>
    </span><span class='line'>    <span class="k">if</span> <span class="p">(</span><span class="nb">self</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>        <span class="k">for</span> <span class="p">(</span><span class="bp">NSUInteger</span> <span class="n">i</span> <span class="o">=</span> <span class="mi">0</span><span class="p">;</span> <span class="n">i</span> <span class="o">&lt;</span> <span class="n">numItems</span><span class="p">;</span> <span class="n">i</span><span class="o">++</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>            <span class="n">_list</span><span class="p">.</span><span class="n">push_back</span><span class="p">(</span><span class="l">@(</span><span class="n">random</span><span class="p">()</span><span class="l">)</span><span class="p">);</span>
    </span><span class='line'>        <span class="p">}</span>
    </span><span class='line'>    <span class="p">}</span>
    </span><span class='line'>    <span class="k">return</span> <span class="nb">self</span><span class="p">;</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="cp">#define USE_STACKBUF 1</span>
    </span><span class='line'>
    </span><span class='line'><span class="p">-</span> <span class="p">(</span><span class="bp">NSUInteger</span><span class="p">)</span><span class="nf">countByEnumeratingWithState:</span><span class="p">(</span><span class="n">NSFastEnumerationState</span> <span class="o">*</span><span class="p">)</span><span class="nv">state</span> <span class="nf">objects:</span><span class="p">(</span><span class="kt">id</span> <span class="n">__unsafe_unretained</span> <span class="p">[])</span><span class="nv">stackbuf</span> <span class="nf">count:</span><span class="p">(</span><span class="bp">NSUInteger</span><span class="p">)</span><span class="nv">len</span> <span class="p">{</span>
    </span><span class='line'>    <span class="c1">// 这个方法的返回值，即我们需要返回的 C 数组的长度</span>
    </span><span class='line'>    <span class="bp">NSUInteger</span> <span class="n">count</span> <span class="o">=</span> <span class="mi">0</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="c1">// 我们前面已经提到了，这个方法是会被多次调用的</span>
    </span><span class='line'>    <span class="c1">// 因此，我们需要使用 state-&gt;state 来保存当前遍历到了 _list 的什么位置</span>
    </span><span class='line'>    <span class="kt">unsigned</span> <span class="kt">long</span> <span class="n">countOfItemsAlreadyEnumerated</span> <span class="o">=</span> <span class="n">state</span><span class="o">-&gt;</span><span class="n">state</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="c1">// 当 countOfItemsAlreadyEnumerated 为 0 时，表示第一次调用这个方法</span>
    </span><span class='line'>    <span class="c1">// 我们可以在这里做一些初始化的设置</span>
    </span><span class='line'>    <span class="k">if</span> <span class="p">(</span><span class="n">countOfItemsAlreadyEnumerated</span> <span class="o">==</span> <span class="mi">0</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>        <span class="c1">// 我们前面已经提到了，state-&gt;mutationsPtr 是用来追踪集合在遍历过程中的突变的</span>
    </span><span class='line'>        <span class="c1">// 它不能为 NULL ，并且也不应该指向 self</span>
    </span><span class='line'>        <span class="c1">//</span>
    </span><span class='line'>        <span class="c1">// 这里，因为我们的 Array 类是不可变的，所以我们不需要追踪它的突变</span>
    </span><span class='line'>        <span class="c1">// 因此，我们的做法是将它指向 state-&gt;extra 的其中一个值</span>
    </span><span class='line'>        <span class="c1">// 因为我们知道 NSFastEnumeration 协议本身并没有用到 state-&gt;extra</span>
    </span><span class='line'>        <span class="c1">//</span>
    </span><span class='line'>        <span class="c1">// 但是，如果你的集合是可变的，那么你可以考虑将 state-&gt;mutationsPtr 指向一个内部变量</span>
    </span><span class='line'>        <span class="c1">// 而这个内部变量的值会在你的集合突变时发生变化</span>
    </span><span class='line'>        <span class="n">state</span><span class="o">-&gt;</span><span class="n">mutationsPtr</span> <span class="o">=</span> <span class="o">&amp;</span><span class="n">state</span><span class="o">-&gt;</span><span class="n">extra</span><span class="p">[</span><span class="mi">0</span><span class="p">];</span>
    </span><span class='line'>    <span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="cp">#if USE_STACKBUF</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="c1">// 判断我们是否已经遍历完 _list</span>
    </span><span class='line'>    <span class="k">if</span> <span class="p">(</span><span class="n">countOfItemsAlreadyEnumerated</span> <span class="o">&lt;</span> <span class="n">_list</span><span class="p">.</span><span class="n">size</span><span class="p">())</span> <span class="p">{</span>
    </span><span class='line'>        <span class="c1">// 我们知道 state-&gt;itemsPtr 就是这个方法返回的 C 数组指针，它不能为 NULL</span>
    </span><span class='line'>        <span class="c1">// 在这里，我们将 state-&gt;itemsPtr 指向调用者提供的 C 数组 stackbuf</span>
    </span><span class='line'>        <span class="n">state</span><span class="o">-&gt;</span><span class="n">itemsPtr</span> <span class="o">=</span> <span class="n">stackbuf</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="c1">// 将 _list 中的元素填充到 stackbuf 中，直到以下两个条件中的任意一个满足时为止</span>
    </span><span class='line'>        <span class="c1">// 1\. 已经遍历完 _list 中的所有元素</span>
    </span><span class='line'>        <span class="c1">// 2\. 已经填充满 stackbuf</span>
    </span><span class='line'>        <span class="k">while</span> <span class="p">(</span><span class="n">countOfItemsAlreadyEnumerated</span> <span class="o">&lt;</span> <span class="n">_list</span><span class="p">.</span><span class="n">size</span><span class="p">()</span> <span class="o">&amp;&amp;</span> <span class="n">count</span> <span class="o">&lt;</span> <span class="n">len</span><span class="p">)</span> <span class="p">{</span>
    </span><span class='line'>            <span class="c1">// 取出 _list 中的元素填充到 stackbuf 中</span>
    </span><span class='line'>            <span class="n">stackbuf</span><span class="p">[</span><span class="n">count</span><span class="p">]</span> <span class="o">=</span> <span class="n">_list</span><span class="p">[</span><span class="n">countOfItemsAlreadyEnumerated</span><span class="p">];</span>
    </span><span class='line'>
    </span><span class='line'>            <span class="c1">// 更新我们的遍历位置</span>
    </span><span class='line'>            <span class="n">countOfItemsAlreadyEnumerated</span><span class="o">++</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>            <span class="c1">// 更新我们返回的 C 数组的长度，使之与 state-&gt;itemsPtr 中的元素个数相匹配</span>
    </span><span class='line'>            <span class="n">count</span><span class="o">++</span><span class="p">;</span>
    </span><span class='line'>        <span class="p">}</span>
    </span><span class='line'>    <span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="cp">#else</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="c1">// 判断我们是否已经遍历完 _list</span>
    </span><span class='line'>    <span class="k">if</span> <span class="p">(</span><span class="n">countOfItemsAlreadyEnumerated</span> <span class="o">&lt;</span> <span class="n">_list</span><span class="p">.</span><span class="n">size</span><span class="p">())</span> <span class="p">{</span>
    </span><span class='line'>        <span class="c1">// 直接将 state-&gt;itemsPtr 指向内部的 C 数组指针，因为它的内存地址是连续的</span>
    </span><span class='line'>        <span class="n">__unsafe_unretained</span> <span class="k">const</span> <span class="kt">id</span> <span class="o">*</span> <span class="n">const_array</span> <span class="o">=</span> <span class="n">_list</span><span class="p">.</span><span class="n">data</span><span class="p">();</span>
    </span><span class='line'>        <span class="n">state</span><span class="o">-&gt;</span><span class="n">itemsPtr</span> <span class="o">=</span> <span class="p">(</span><span class="n">__typeof__</span><span class="p">(</span><span class="n">state</span><span class="o">-&gt;</span><span class="n">itemsPtr</span><span class="p">))</span><span class="n">const_array</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>        <span class="c1">// 因为我们一次性返回了 _list 中的所有元素</span>
    </span><span class='line'>        <span class="c1">// 所以，countOfItemsAlreadyEnumerated 和 count 的值均为 _list 中的元素个数</span>
    </span><span class='line'>        <span class="n">countOfItemsAlreadyEnumerated</span> <span class="o">=</span> <span class="n">_list</span><span class="p">.</span><span class="n">size</span><span class="p">();</span>
    </span><span class='line'>        <span class="n">count</span> <span class="o">=</span> <span class="n">_list</span><span class="p">.</span><span class="n">size</span><span class="p">();</span>
    </span><span class='line'>    <span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="cp">#endif</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="c1">// 将本次调用得到的 countOfItemsAlreadyEnumerated 保存到 state-&gt;state 中</span>
    </span><span class='line'>    <span class="c1">// 因为 NSFastEnumeration 协议本身并没有用到 state-&gt;state</span>
    </span><span class='line'>    <span class="c1">// 所以，我们可以将这个值保留到下一次调用</span>
    </span><span class='line'>    <span class="n">state</span><span class="o">-&gt;</span><span class="n">state</span> <span class="o">=</span> <span class="n">countOfItemsAlreadyEnumerated</span><span class="p">;</span>
    </span><span class='line'>
    </span><span class='line'>    <span class="c1">// 返回 C 数组的长度</span>
    </span><span class='line'>    <span class="k">return</span> <span class="n">count</span><span class="p">;</span>
    </span><span class='line'><span class="p">}</span>
    </span><span class='line'>
    </span><span class='line'><span class="k">@end</span>
    </span>`</pre></td></tr></table></div></figure>

    我已经在上面的代码中添加了必要的注释，相信你理解起来应该没有什么难度。不过，值得一提的是，在第二种方式的实现中，我们用到了 ARC 下不同所有权对象之间的相互转换，代码如下：

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="n">__unsafe_unretained</span> <span class="k">const</span> <span class="kt">id</span> <span class="o">*</span> <span class="n">const_array</span> <span class="o">=</span> <span class="n">_list</span><span class="p">.</span><span class="n">data</span><span class="p">();</span>
    </span><span class='line'><span class="n">state</span><span class="o">-&gt;</span><span class="n">itemsPtr</span> <span class="o">=</span> <span class="p">(</span><span class="n">__typeof__</span><span class="p">(</span><span class="n">state</span><span class="o">-&gt;</span><span class="n">itemsPtr</span><span class="p">))</span><span class="n">const_array</span><span class="p">;</span>
    </span>
</td></tr></table></div></figure>

其实，这里面涉及到两次类型转换，第一次是从 `__strong NSNumber *` 类型转换到 `__unsafe_unretained const id *` 类型，第二次是从 `__unsafe_unretained const id *` 类型转换到 `id __unsafe_unretained *` 类型，更多信息可以查看 [AutomaticReferenceCounting](http://clang.llvm.org/docs/AutomaticReferenceCounting.html) 中的 4.3.3 小节。

另外，我在前面的文章[《ReactiveCocoa v2.5 源码解析之架构总览》](http://blog.leichunfeng.com/blog/2015/12/25/reactivecocoa-v2-dot-5-yuan-ma-jie-xi-zhi-jia-gou-zong-lan/)中，已经有提到过，[ReactiveCocoa](https://github.com/ReactiveCocoa/ReactiveCocoa/tree/v2.5) 中的 [RACSequence](https://github.com/ReactiveCocoa/ReactiveCocoa/blob/v2.5/ReactiveCocoa/RACSequence.m) 类其实是实现了 `NSFastEnumeration` 协议的。因为 `RACSequence` 中的元素在内存上并不连续，所以它采用的是第一种实现方式。对此感兴趣的同学，可以去看看它的实现源码，这里不再赘述。

## 总结

本文从 `NSFastEnumeration` 协议的定义出发，解析了 `- countByEnumeratingWithState:objects:count:` 方法中的返回值以及各个参数的含义；接着，我们使用 `clang -rewrite-objc` 命令探究了快速枚举的内部实现；最后，通过一个自定义的集合类 `Array` 演示了两种实现 `NSFastEnumeration` 协议的方式，希望本文能够对你有所帮助。

## 参考链接

[https://www.mikeash.com/pyblog/friday-qa-2010-04-16-implementing-fast-enumeration.html](https://www.mikeash.com/pyblog/friday-qa-2010-04-16-implementing-fast-enumeration.html)
[https://zh.wikipedia.org/wiki/Objective-C#.E5.BF.AB.E9.80.9F.E6.9E.9A.E4.B8.BE](https://zh.wikipedia.org/wiki/Objective-C#.E5.BF.AB.E9.80.9F.E6.9E.9A.E4.B8.BE)
[https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/Collections/Articles/Enumerators.html#//apple_ref/doc/uid/20000135-SW1](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/Collections/Articles/Enumerators.html#//apple_ref/doc/uid/20000135-SW1)

**版权声明**：我已将本文在微信公众平台的发表权「独家代理」给 iOS 开发（iOSDevTips）微信公众号。扫下方二维码即可关注「iOS 开发」：

![iOS 开发二维码](http://blog.devtang.com/images/weixin-qr.jpg)