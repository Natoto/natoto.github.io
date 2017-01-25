---
title: Swift中类的初始化器与继承
tags: []
date: 2014-09-21 09:16:38
---

本文算是对苹果官方<The Swift Programming Language>一书中关于类的初始化器与其继承部分的整理笔记。内容较基础，已看过该书的就不用浪费时间阅读啦。

首先，Swift 为类定义了两种初始化器来确保类中所有的储存属性都能得到一个初始化值。这两种初始化器就是「指定初始化器」(Designated Initializer)与「便利初始化器」(Convenience Initializer)。

# 指定初始化器与便利初始化器

指定初始化器是类的最主要的初始化器，它会将类中所有的属性赋值初始化，并且一路往上调用类的父类的指定初始化器去初始化它们各自引入的属性。类可以有许多个指定初始化器，也可以只有一个，但必须至少有一个。

便利初始化器顾名思义就是方便开发者调用的初始化器，它必须调用同个类的指定初始化器，提供一些默认的参数给指定初始化器来生成一个默认的类的实例。一个类可以没有便利初始化器。

# 初始化器链

为了简化指定初始化器与便利初始化器的关系，我们规定了以下三条规则：

*   指定初始化器必须调用其父类的指定初始化器
*   便利初始化器初始化器必须调用该类中另一个初始化器
*   便利初始化器最终必须调用一个指定初始化器

简单的说，就是指定初始化器必须在类的继承关系中一路向上调用，便利初始化器必须在该类中一路往指定初始化器调用。
画成图表表示，就是
![Header](/2014-07-26/001.png)

上图可以看到，父类有一个指定初始化器和两个便利初始化器，一个便利初始化器调用了另一个遍历初始化器，但最终他们都会调用指定初始化器。
而在子类中，指定初始化器最终是向上，调用其父类的指定初始化器。

# 初始化的两个步骤

在 Swift 中，类的初始化需要经历两个步骤，第一个步骤中，每一个该类引入的储存属性都需要给赋上一个初始值。完成后，执行第二个步骤，每个类都可以再对属性进行自定义修改。
详细点说，即是：

### 步骤一

*   一个类的指定或便利初始化器需被调用
*   类的实例的内存被申请，但还没有初始化
*   指定初始化器确保当前类引入的所有储存属性都初始化
*   指定初始化器调用其父类的指定初始化器，继续让父类去初始化它所引入的储存属性
*   上面这个过程一直进行直到最终的根类的指定初始化器被调用
*   当根类的指定初始化器调用后，该类的实例就已经确保了所有储存属性都已经初始化完成，步骤一完成。

### 步骤二

*   步骤二是从根类的指定初始化器开始的，一层层到最终的子类的指定初始化器
*   在这个步骤中，每个类都有机会对已经步骤一中初始化完成的实例再次进行自定义修改。此时初始化器已经可以访问 self，修改属性或者调用实例方法了。

# 初始化器的继承与覆盖

不像 Objective-C，Swift 的类并不会默认继承其父类的初始化器。但也有例外，只要满足了一定条件，子类还是会自动继承父类的初始化器的。我们定义了以下规则：

### 规则一

如果你的子类没有定义任何指定初始化器，则其会自动继承其父类的所有指定初始化器

### 规则二

如果你的子类实现了其父类的所有指定初始化器，不管是自定义的实现还是因为规则一造成的实现，该子类自动继承其父类所有的便利初始化器。

# 与 Objective-C 的初始化器交互

Swift 调用 Objective-C 的类，其初始化方法自动省去&quot;Init&quot;或&quot;InitWith&quot;关键字。比如

<div class="codehilite"><pre><span class="c1">//Objective-C</span>
<span class="n">UILabel</span> <span class="o">*</span><span class="n">label</span> <span class="o">=</span> <span class="p">[</span><span class="n">UILabel</span> <span class="n">alloc</span><span class="p">]</span> <span class="n">init</span><span class="p">];</span>

<span class="n">UITableView</span> <span class="o">*</span><span class="n">myTableView</span> <span class="o">=</span> <span class="p">[[</span><span class="n">UITableView</span> <span class="n">alloc</span><span class="p">]</span> <span class="n">initWithFrame</span><span class="o">:</span><span class="n">CGRectZero</span> <span class="n">style</span><span class="o">:</span><span class="n">UITableViewStyleGrouped</span><span class="p">];</span>
</pre></div>

在 Swift 中，写成

<div class="codehilite"><pre><span class="c1">//Swift</span>
<span class="n">let</span> <span class="n">label</span><span class="k">:</span> <span class="kt">UILabel</span> <span class="o">=</span> <span class="nc">UILabel</span><span class="o">()</span>

<span class="n">let</span> <span class="n">myTableView</span><span class="k">:</span> <span class="kt">UITableView</span> <span class="o">=</span> <span class="nc">UITableView</span><span class="o">(</span><span class="n">frame</span><span class="k">:</span> <span class="kt">CGRectZero</span><span class="o">,</span> <span class="n">style</span><span class="k">:</span> <span class="kt">.Grouped</span><span class="o">)</span>
</pre></div>

你也不需要调用 alloc，Swift 会帮你搞定这步的。

另外，某些 Objective-C 中方便的用于类的初始化的工厂方法，也映射到了 Swift 中，比如

<div class="codehilite"><pre><span class="c1">//Objective-C</span>
<span class="n">UIColor</span> <span class="o">*</span><span class="n">color</span> <span class="o">=</span> <span class="p">[</span><span class="n">UIColor</span> <span class="n">colorWithRed</span><span class="o">:</span><span class="mf">0.5</span> <span class="n">green</span><span class="o">:</span><span class="mf">0.0</span> <span class="n">blue</span><span class="o">:</span><span class="mf">0.5</span> <span class="n">alpha</span><span class="o">:</span><span class="mf">1.0</span><span class="p">];</span>
</pre></div>

在Swift中：

<div class="codehilite"><pre><span class="c1">//Swift</span>
<span class="n">let</span> <span class="n">color</span> <span class="k">=</span> <span class="nc">UIColor</span><span class="o">(</span><span class="n">red</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">5</span><span class="o">,</span> <span class="n">green</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">0</span><span class="o">,</span> <span class="n">blue</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">5</span><span class="o">,</span> <span class="n">alpha</span><span class="k">:</span> <span class="err">1</span><span class="kt">.</span><span class="err">0</span><span class="o">)</span>
</pre></div>