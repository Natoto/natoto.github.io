---
title: Swift 的 autoclosure
tags: []
date: 2016-02-24 16:10:46
---

Swift 的 autoclosure

在 Swift 中，如果一个函数，接收一个 closure 作为参数，我们可以这么写:

<div class="codehilite"><pre><span class="kd">func</span> <span class="nf">op</span><span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span> <span class="p">{</span>
    <span class="k">return</span> <span class="mi">8</span>
<span class="p">}</span>

<span class="kd">func</span> <span class="nf">function</span><span class="p">(</span><span class="n">a</span><span class="p">:</span> <span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span><span class="p">)</span> <span class="p">{</span>
    <span class="bp">print</span><span class="p">(</span><span class="n">a</span><span class="p">())</span>
<span class="p">}</span>

<span class="c1">//调用</span>
<span class="n">function</span><span class="p">{</span> <span class="n">op</span><span class="p">()</span> <span class="p">}</span> <span class="c1">//打印8</span>
</pre></div>

如果这个参数使用 autoclosure 修饰，则可以这么写:

<div class="codehilite"><pre><span class="kd">func</span> <span class="nf">op</span><span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span> <span class="p">{</span>
    <span class="k">return</span> <span class="mi">8</span>
<span class="p">}</span>

<span class="kd">func</span> <span class="nf">function</span><span class="p">(</span><span class="kr">@autoclosure</span> <span class="n">a</span><span class="p">:</span> <span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span><span class="p">)</span> <span class="p">{</span>
    <span class="bp">print</span><span class="p">(</span><span class="n">a</span><span class="p">())</span>
<span class="p">}</span>

<span class="c1">//调用</span>
<span class="n">function</span><span class="p">(</span><span class="n">op</span><span class="p">())</span> <span class="c1">//打印8</span>
</pre></div>

Swift 会将该参数自动包到 closure 里传给函数。那么除了语法区别，还有什么作用呢？
一个很好的例子就是 swift 自带的 ?? 操作符，这个操作符很简单，如果让我们自己实现，第一想到的就是这样写：

<div class="codehilite"><pre><span class="kr">infix</span> <span class="kd">operator</span> <span class="p">???</span> <span class="p">{</span><span class="kr">associativity</span> <span class="kr">right</span> <span class="kr">precedence</span> <span class="mi">110</span><span class="p">}</span>

<span class="kd">func</span> <span class="p">???&lt;</span><span class="n">T</span><span class="p">&gt;(</span><span class="n">opt</span><span class="p">:</span> <span class="n">T</span><span class="p">?,</span> <span class="n">defaultVal</span><span class="p">:</span> <span class="n">T</span><span class="p">)</span> <span class="p">-&gt;</span> <span class="n">T</span> <span class="p">{</span>
    <span class="k">if</span> <span class="kd">let</span> <span class="nv">x</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">x</span>
    <span class="p">}</span> <span class="k">else</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">defaultVal</span>
    <span class="p">}</span>
<span class="p">}</span>

<span class="kd">let</span> <span class="nv">opt</span><span class="p">:</span> <span class="nb">Int</span><span class="p">?</span> <span class="p">=</span> <span class="mi">1</span>
<span class="kd">let</span> <span class="nv">nilopt</span><span class="p">:</span> <span class="nb">Int</span><span class="p">?</span> <span class="p">=</span> <span class="kc">nil</span>
<span class="kd">let</span> <span class="nv">a</span><span class="p">:</span> <span class="nb">Int</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">???</span> <span class="mi">10</span>
<span class="kd">let</span> <span class="nv">b</span><span class="p">:</span> <span class="nb">Int</span> <span class="p">=</span> <span class="n">nilopt</span> <span class="p">???</span> <span class="mi">10</span>
<span class="bp">print</span><span class="p">(</span><span class="n">a</span><span class="p">)</span>  <span class="c1">//打印1</span>
<span class="bp">print</span><span class="p">(</span><span class="n">b</span><span class="p">)</span>  <span class="c1">//打印10</span>
</pre></div>

看起来不错，但是其实有个问题，假如我们的 defaultVal 传的是一个返回 Int 的函数，那么即使 opt 不是 nil，defaultVal 值不会被用到，这个函数也会被执行：

<div class="codehilite"><pre><span class="kd">func</span> <span class="nf">op</span><span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span> <span class="p">{</span>
    <span class="bp">print</span><span class="p">(</span><span class="s">&quot;run&quot;</span><span class="p">)</span>
    <span class="k">return</span> <span class="mi">8</span>
<span class="p">}</span>

<span class="kd">let</span> <span class="nv">opt</span><span class="p">:</span> <span class="nb">Int</span><span class="p">?</span> <span class="p">=</span> <span class="mi">1</span>
<span class="kd">let</span> <span class="nv">a</span><span class="p">:</span> <span class="nb">Int</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">???</span> <span class="n">op</span><span class="p">()</span>
<span class="bp">print</span><span class="p">(</span><span class="n">a</span><span class="p">)</span>
<span class="c1">//打印 run\n 1</span>
</pre></div>

这里 op 函数的执行是没有必要的，因为 opt 是有值的，op 函数的结果不会被用到，这里做了一次额外不用的运算，如果 op 函数的性能开销很大，对整个 app 的性能是有影响的。

解决方法就是把 defaultVal 作为一个 closure，这样只有在 opt 为 nil 时，才会去执行 closure 里的代码

<div class="codehilite"><pre><span class="kd">func</span> <span class="nf">op</span><span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span> <span class="p">{</span>
    <span class="bp">print</span><span class="p">(</span><span class="s">&quot;run&quot;</span><span class="p">)</span>
    <span class="k">return</span> <span class="mi">8</span>
<span class="p">}</span>

<span class="kr">infix</span> <span class="kd">operator</span> <span class="p">???</span> <span class="p">{</span><span class="kr">associativity</span> <span class="kr">right</span> <span class="kr">precedence</span> <span class="mi">110</span><span class="p">}</span>

<span class="kd">func</span> <span class="p">???&lt;</span><span class="n">T</span><span class="p">&gt;(</span><span class="n">opt</span><span class="p">:</span> <span class="n">T</span><span class="p">?,</span> <span class="n">defaultVal</span><span class="p">:</span> <span class="p">()</span> <span class="p">-&gt;</span> <span class="n">T</span><span class="p">)</span> <span class="p">-&gt;</span> <span class="n">T</span> <span class="p">{</span>
    <span class="k">if</span> <span class="kd">let</span> <span class="nv">x</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">x</span>
    <span class="p">}</span> <span class="k">else</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">defaultVal</span><span class="p">()</span>
    <span class="p">}</span>
<span class="p">}</span>

<span class="kd">let</span> <span class="nv">opt</span><span class="p">:</span> <span class="nb">Int</span><span class="p">?</span> <span class="p">=</span> <span class="mi">1</span>
<span class="kd">let</span> <span class="nv">a</span><span class="p">:</span> <span class="nb">Int</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">???</span> <span class="p">{</span><span class="n">op</span><span class="p">()}</span>
<span class="bp">print</span><span class="p">(</span><span class="n">a</span><span class="p">)</span>
<span class="c1">//打印 1</span>
</pre></div>

看到那奇怪的中括号了么，因为我们 defaultVal 参数接受的是一个 closure，参数打上大括号作为一个 closure 传入。
这显然是不太能接受的语法。所以我们需要 autoclosure，把参数自动包成 closure。

<div class="codehilite"><pre><span class="kd">func</span> <span class="nf">op</span><span class="p">()</span> <span class="p">-&gt;</span> <span class="nb">Int</span> <span class="p">{</span>
    <span class="bp">print</span><span class="p">(</span><span class="s">&quot;run&quot;</span><span class="p">)</span>
    <span class="k">return</span> <span class="mi">8</span>
<span class="p">}</span>

<span class="kr">infix</span> <span class="kd">operator</span> <span class="p">???</span> <span class="p">{</span><span class="kr">associativity</span> <span class="kr">right</span> <span class="kr">precedence</span> <span class="mi">110</span><span class="p">}</span>

<span class="kd">func</span> <span class="p">???&lt;</span><span class="n">T</span><span class="p">&gt;(</span><span class="n">opt</span><span class="p">:</span> <span class="n">T</span><span class="p">?,</span> <span class="kr">@autoclosure</span> <span class="n">defaultVal</span><span class="p">:</span> <span class="p">()</span> <span class="p">-&gt;</span> <span class="n">T</span><span class="p">)</span> <span class="p">-&gt;</span> <span class="n">T</span> <span class="p">{</span>
    <span class="k">if</span> <span class="kd">let</span> <span class="nv">x</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">x</span>
    <span class="p">}</span> <span class="k">else</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">defaultVal</span><span class="p">()</span>
    <span class="p">}</span>
<span class="p">}</span>

<span class="kd">let</span> <span class="nv">opt</span><span class="p">:</span> <span class="nb">Int</span><span class="p">?</span> <span class="p">=</span> <span class="mi">1</span>
<span class="kd">let</span> <span class="nv">a</span><span class="p">:</span> <span class="nb">Int</span> <span class="p">=</span> <span class="n">opt</span> <span class="p">???</span> <span class="n">op</span><span class="p">()</span>
<span class="bp">print</span><span class="p">(</span><span class="n">a</span><span class="p">)</span>
<span class="c1">//打印 1</span>
</pre></div>