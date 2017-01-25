---
title: WatchKit 的 WKInterfaceTable 简单使用
tags: []
date: 2014-11-19 20:33:19
---

WKInterfaceTable 类似 UITableView, 其用途即展示一个表格并且用户可以与之交互。但不同的是 WKInterfaceTable 的功能更加简单，使用上也很粗暴直接。

本文一步步演示了创建一个简单的包含 WKInterfaceTable 的 Apple Watch App！

我们首先按照老办法，创建一个 Single View Application 模板的 iOS 应用。
工程创建好后，点击 File -&gt; Add -&gt; Target，选择 Apple Watch 标签下的 Watch App。Xcode 会添加一个工程名 Watch App 目录。同时，运行 Watch App 的 scheme 也会被添加。

![image](/WatchTable/001.png)

选中 Watch App 的 scheme，编译运行。模拟器并不会同时启用 Apple Watch 模拟器，需要点击 Hardware -&gt; External Displays -&gt; Apple Watch。

![image](/WatchTable/002.png)

Watch App 成功运行。

接下来就是添加 WKInterfaceTable。

点击 Watch App 目录下的 storyboard，拖拽一个 WKInterfaceTable 到界面上。然后拖一个 table 的 outlet 到 InterfaceController 上，我们命名为 tableView。

![image](/WatchTable/003.png)

不同于 UITableView 每一个 Cell 的原型对应一个 UITableViewCell，WKInterfaceTable 是使用 TableRowController 作为原型，其就是 NSObject。

我们在 Watch Extension 目录添加一个继承自 NSObject 的类，取名 RowType，将 storyboard 中的 RowController 的类改为刚创建的 RowType，并且赋一个 identifier：rowType。

拖拽一个 WKInterfaceLabel 到 row 上，同样拖一个 outlet 到 RowType。注意，要在 RowType 上添加 WatchKit 模块：

<div class="codehilite"><pre><span class="k">import</span> <span class="n">UIKit</span>
<span class="k">import</span> <span class="n">WatchKit</span>

<span class="k">class</span> <span class="nl">RowType</span><span class="p">:</span> <span class="bp">NSObject</span> <span class="p">{</span>
    <span class="p">@</span><span class="kt">IBOutlet</span> <span class="k">weak</span> <span class="k">var</span> <span class="nl">labelNumber</span><span class="p">:</span> <span class="n">WKInterfaceLabel</span><span class="o">!</span>
<span class="p">}</span>
</pre></div>

接下来就是告诉 table 有多少数据，该如何展示了。我们直接在 willActivate 方法中对 table 进行初始化。

不同于 UITableView 还需要写 DataSource 方法回调，WKInterfaceTable 非常简单，直接使用setNumberOfRows:withRowType 方法定义行数与 row 原型。这里 RowType 就是 RowController 的 identifier。对每个 row 进行配置也是通过 rowControllerAtIndex 方法遍历得到每一个 rowController，依次配置。

<div class="codehilite"><pre><span class="kr">override</span> <span class="k">func</span> <span class="nf">willActivate</span><span class="p">()</span> <span class="p">{</span>
    <span class="nb">super</span><span class="p">.</span><span class="n">willActivate</span><span class="p">()</span>
    <span class="c1">//设置行数与原型类型</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">tableView</span><span class="p">.</span><span class="n">setNumberOfRows</span><span class="p">(</span><span class="mi">10</span><span class="p">,</span> <span class="nl">withRowType</span><span class="p">:</span> <span class="s">&quot;rowType&quot;</span><span class="p">)</span> 
    <span class="c1">//遍历，获取每一个 rowController，配置</span>
    <span class="k">for</span> <span class="n">i</span> <span class="k">in</span> <span class="mf">0.</span><span class="p">.</span><span class="o">&lt;</span><span class="nb">self</span><span class="p">.</span><span class="n">tableView</span><span class="p">.</span><span class="n">numberOfRows</span> <span class="p">{</span>
        <span class="k">let</span> <span class="nl">row</span><span class="p">:</span> <span class="n">RowType</span> <span class="o">=</span> <span class="nb">self</span><span class="p">.</span><span class="n">tableView</span><span class="p">.</span><span class="n">rowControllerAtIndex</span><span class="p">(</span><span class="n">i</span><span class="p">)</span> <span class="kt">as</span> <span class="n">RowType</span>
        <span class="n">row</span><span class="p">.</span><span class="n">labelNumber</span><span class="p">.</span><span class="n">setText</span><span class="p">(</span><span class="s">&quot;\(i)&quot;</span><span class="p">)</span>
    <span class="p">}</span>   
<span class="p">}</span>
</pre></div>

运行，得如下结果：
![image](/WatchTable/004.png)

接下来是定义交互，我们需要点击某一行的回调，这里很像 UITableView 的 didSelectRowAtIndex, 我们直接在 InterfaceController 中添加 table:didSelectRowAtIndex 方法。

<div class="codehilite"><pre><span class="kr">override</span> <span class="k">func</span> <span class="nf">table</span><span class="p">(</span><span class="nl">table</span><span class="p">:</span> <span class="n">WKInterfaceTable</span><span class="p">,</span> <span class="n">didSelectRowAtIndex</span> <span class="nl">rowIndex</span><span class="p">:</span> <span class="n">Int</span><span class="p">)</span> <span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">&quot;\(rowIndex)&quot;</span><span class="p">)</span>
<span class="p">}</span>
</pre></div>

运行：
![image](/WatchTable/005.gif)

至此，一个简单的包含 WKInterfaceTable 的 Watch App 就完成了。