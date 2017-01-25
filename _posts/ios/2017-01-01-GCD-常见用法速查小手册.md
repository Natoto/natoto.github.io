---
title: GCD 常见用法速查小手册
tags: []
date: 2016-08-01 11:19:22
---

# 提交 block

在主队列提交一个异步 block

<div class="codehilite"><pre><span class="n">dispatch_async</span><span class="p">(</span><span class="n">dispatch_get_main_queue</span><span class="p">(),</span> <span class="o">^</span><span class="p">{</span>
    <span class="c1">//Your codes</span>
<span class="p">});</span>
</pre></div>

在默认优先级的全局队列提交一个同步 block，请尽量使用默认优先级，除非你真的知道你在做什么。

<div class="codehilite"><pre><span class="n">dispatch_sync</span><span class="p">(</span><span class="n">dispatch_get_global_queue</span><span class="p">(</span><span class="n">DISPATCH_QUEUE_PRIORITY_DEFAULT</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="o">^</span><span class="p">{</span>
    <span class="c1">//Your codes</span>
<span class="p">});</span>
</pre></div>

# dispatch_once

<div class="codehilite"><pre><span class="k">static</span> <span class="n">dispatch_once_t</span> <span class="n">onceToken</span><span class="p">;</span>
<span class="k">for</span> <span class="p">(</span><span class="kt">int</span> <span class="n">i</span> <span class="o">=</span> <span class="mi">0</span><span class="p">;</span> <span class="n">i</span> <span class="o">&lt;</span> <span class="mi">5</span><span class="p">;</span> <span class="o">++</span><span class="n">i</span><span class="p">)</span> <span class="p">{</span>
    <span class="n">dispatch_once</span><span class="p">(</span><span class="o">&amp;</span><span class="n">onceToken</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
        <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;once&quot;</span><span class="p">);</span>
    <span class="p">});</span>
<span class="p">}</span>
<span class="c1">//将只打印一次 once，适用于单例初始化等使用场景</span>
</pre></div>

# Group

<div class="codehilite"><pre><span class="c1">//创建一个并行用户队列</span>
<span class="n">dispatch_queue_t</span> <span class="n">queue</span> <span class="o">=</span> <span class="n">dispatch_queue_create</span><span class="p">(</span><span class="s">&quot;myQueue&quot;</span><span class="p">,</span> <span class="n">DISPATCH_QUEUE_CONCURRENT</span><span class="p">);</span>
<span class="c1">//创建一个group</span>
<span class="n">dispatch_group_t</span> <span class="n">group</span> <span class="o">=</span> <span class="n">dispatch_group_create</span><span class="p">();</span>

<span class="c1">//该 dispatch_apply 作用是执行5次block，将每个block加入到queued队列中。当所有block执行完毕后，返回</span>
<span class="n">dispatch_apply</span><span class="p">(</span><span class="mi">5</span><span class="p">,</span> <span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">(</span><span class="kt">size_t</span> <span class="n">n</span><span class="p">)</span> <span class="p">{</span>
    <span class="c1">//进入 group</span>
    <span class="n">dispatch_group_enter</span><span class="p">(</span><span class="n">group</span><span class="p">);</span>
    <span class="c1">//异步执行</span>
    <span class="n">dispatch_async</span><span class="p">(</span><span class="n">dispatch_get_global_queue</span><span class="p">(</span><span class="n">DISPATCH_QUEUE_PRIORITY_DEFAULT</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="o">^</span><span class="p">{</span>
        <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;sleep&quot;</span><span class="p">);</span>
        <span class="n">sleep</span><span class="p">((</span><span class="kt">int</span><span class="p">)</span><span class="n">n</span><span class="p">);</span>
        <span class="c1">//退出 group</span>
        <span class="n">dispatch_group_leave</span><span class="p">(</span><span class="n">group</span><span class="p">);</span>
    <span class="p">});</span>
<span class="p">});</span>

<span class="c1">//当所有异步block退出group后， group_notify 会被执行，表明group执行完毕</span>
<span class="n">dispatch_group_notify</span><span class="p">(</span><span class="n">group</span><span class="p">,</span> <span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;finished!&quot;</span><span class="p">);</span>
<span class="p">});</span>

<span class="n">dispatch_apply</span><span class="p">(</span><span class="mi">5</span><span class="p">,</span> <span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">(</span><span class="kt">size_t</span> <span class="n">n</span><span class="p">)</span> <span class="p">{</span>
    <span class="c1">//也可以这么写，dispatch_group_async 会自动将 block 与 group 关联</span>
    <span class="n">dispatch_group_async</span><span class="p">(</span><span class="n">group</span><span class="p">,</span> <span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
        <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;sleep&quot;</span><span class="p">);</span>
        <span class="n">sleep</span><span class="p">((</span><span class="kt">int</span><span class="p">)</span><span class="n">n</span><span class="p">);</span>
    <span class="p">});</span>
<span class="p">});</span>

<span class="n">dispatch_group_notify</span><span class="p">(</span><span class="n">group</span><span class="p">,</span> <span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;finished!&quot;</span><span class="p">);</span>
<span class="p">});</span>
</pre></div>

# Semaphore

<div class="codehilite"><pre><span class="c1">//创建一个串行用户队列</span>
<span class="n">dispatch_queue_t</span> <span class="n">queue</span> <span class="o">=</span> <span class="n">dispatch_queue_create</span><span class="p">(</span><span class="nb">NULL</span><span class="p">,</span> <span class="n">DISPATCH_QUEUE_CONCURRENT</span><span class="p">);</span>
<span class="c1">//创建一个semaphore，信号量为0（直接阻塞），如果要设一个资源访问数量限制，可以设信号量为</span>
<span class="c1">//该数量限制，每当一个线程访问该资源，调用 semphore_wait, 信号量 -1， 当信号量为0，阻塞</span>
<span class="n">dispatch_semaphore_t</span> <span class="n">semaphore</span> <span class="o">=</span> <span class="n">dispatch_semaphore_create</span><span class="p">(</span><span class="mi">0</span><span class="p">);</span>
<span class="n">dispatch_async</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;sleep&quot;</span><span class="p">);</span>
    <span class="n">sleep</span><span class="p">(</span><span class="mi">3</span><span class="p">);</span>
    <span class="c1">//信号量 +1</span>
    <span class="n">dispatch_semaphore_signal</span><span class="p">(</span><span class="n">semaphore</span><span class="p">);</span>
<span class="p">});</span>
<span class="c1">//永远等待 semphore, 当信号量不为 0 时，继续执行下面程序</span>
<span class="c1">//dispatch_semaphore_wait 会先检查信号量是否为 0，是则阻塞等待，否则执行将信号量 -1</span>
<span class="n">dispatch_semaphore_wait</span><span class="p">(</span><span class="n">semaphore</span><span class="p">,</span> <span class="n">DISPATCH_TIME_FOREVER</span><span class="p">);</span>
<span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;go on&quot;</span><span class="p">);</span>
</pre></div>

# Barrier

<div class="codehilite"><pre><span class="n">dispatch_queue_t</span> <span class="n">queue</span> <span class="o">=</span> <span class="n">dispatch_queue_create</span><span class="p">(</span><span class="nb">NULL</span><span class="p">,</span> <span class="n">DISPATCH_QUEUE_CONCURRENT</span><span class="p">);</span>
<span class="n">dispatch_async</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;5&quot;</span><span class="p">);</span>
    <span class="n">sleep</span><span class="p">(</span><span class="mi">5</span><span class="p">);</span>
<span class="p">});</span>
<span class="n">dispatch_async</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;3&quot;</span><span class="p">);</span>
    <span class="n">sleep</span><span class="p">(</span><span class="mi">3</span><span class="p">);</span>
<span class="p">});</span>
<span class="n">dispatch_barrier_async</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="c1">//当在这之前的所有异步操作完成，会执行下面语句，在这里程序结果是等待5秒后执行输出 finished</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;finished&quot;</span><span class="p">);</span>
<span class="p">});</span>
<span class="n">dispatch_async</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;10&quot;</span><span class="p">);</span>
    <span class="n">sleep</span><span class="p">(</span><span class="mi">10</span><span class="p">);</span>
<span class="p">});</span>
</pre></div>

# Data Add

<div class="codehilite"><pre><span class="bp">NSArray</span> <span class="o">*</span><span class="n">integers</span> <span class="o">=</span> <span class="l">@[</span><span class="mi">@1</span><span class="p">,</span> <span class="mi">@2</span><span class="p">,</span> <span class="mi">@3</span><span class="p">,</span> <span class="mi">@4</span><span class="p">,</span> <span class="mi">@5</span><span class="l">]</span><span class="p">;</span>
<span class="c1">//创建一个 dispatch source，类型为 Data add, 其作用是累加接收到的 data</span>
<span class="nb">self</span><span class="p">.</span><span class="n">source_add</span> <span class="o">=</span> <span class="n">dispatch_source_create</span><span class="p">(</span><span class="n">DISPATCH_SOURCE_TYPE_DATA_ADD</span><span class="p">,</span> <span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">,</span> <span class="n">dispatch_get_main_queue</span><span class="p">());</span>
<span class="c1">//设置 source 接收到事件的句柄</span>
<span class="n">dispatch_source_set_event_handler</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">source_add</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="c1">//通过source_get_data来获取数据,获取后，data将清零</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;added: %lu&quot;</span><span class="p">,</span> <span class="n">dispatch_source_get_data</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">source_add</span><span class="p">));</span>
<span class="p">});</span>
<span class="c1">//source 默认状态为挂起，需要手动resume</span>
<span class="n">dispatch_resume</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">source_add</span><span class="p">);</span>
<span class="c1">//该 dispatch_apply 作用是执行5次block，将每个block加入到全局队列中。当所有block执行完毕后，返回</span>
<span class="n">dispatch_apply</span><span class="p">(</span><span class="mi">5</span><span class="p">,</span> <span class="n">dispatch_get_global_queue</span><span class="p">(</span><span class="n">DISPATCH_QUEUE_PRIORITY_DEFAULT</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="o">^</span><span class="p">(</span><span class="kt">size_t</span> <span class="n">index</span><span class="p">)</span> <span class="p">{</span>
    <span class="c1">//像 source 添加 data，GCD会将多次添加merge为1次，所以并不是添加几次就会执行几次句柄</span>
    <span class="n">dispatch_source_merge_data</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">source_add</span><span class="p">,</span> <span class="p">[</span><span class="n">integers</span><span class="p">[</span><span class="n">index</span><span class="p">]</span> <span class="n">integerValue</span><span class="p">]);</span>
<span class="p">});</span>
</pre></div>

# Timer

<div class="codehilite"><pre><span class="c1">//创建一个 dispatch source, 类型为 Timer</span>
<span class="nb">self</span><span class="p">.</span><span class="n">timer</span> <span class="o">=</span> <span class="n">dispatch_source_create</span><span class="p">(</span><span class="n">DISPATCH_SOURCE_TYPE_TIMER</span><span class="p">,</span> <span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">,</span> <span class="n">dispatch_get_main_queue</span><span class="p">());</span>
<span class="c1">//设置 timer 为 walltime（绝对时间，不受程序挂起影响），10秒触发时间，精度为1秒</span>
<span class="n">dispatch_source_set_timer</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">timer</span><span class="p">,</span> <span class="n">dispatch_walltime</span><span class="p">(</span><span class="nb">NULL</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="mi">10</span> <span class="o">*</span> <span class="n">NSEC_PER_SEC</span><span class="p">,</span> <span class="mi">1</span> <span class="o">*</span> <span class="n">NSEC_PER_SEC</span><span class="p">);</span>
<span class="n">dispatch_source_set_event_handler</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">timer</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;10s passed&quot;</span><span class="p">);</span>
    <span class="c1">//cancel source，需要在这里释放 source</span>
    <span class="n">dispatch_source_set_cancel_handler</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">timer</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
        <span class="nb">self</span><span class="p">.</span><span class="n">timer</span> <span class="o">=</span> <span class="nb">nil</span><span class="p">;</span>
    <span class="p">});</span>
    <span class="c1">//执行 source cancel</span>
    <span class="n">dispatch_source_cancel</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">timer</span><span class="p">);</span>
<span class="p">});</span>
<span class="c1">//source 默认状态为挂起，需要手动resume</span>
<span class="n">dispatch_resume</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">timer</span><span class="p">);</span>
</pre></div>

# set_target_queue

<div class="codehilite"><pre><span class="c1">//创建一个串行用户队列</span>
<span class="n">dispatch_queue_t</span> <span class="n">queue</span> <span class="o">=</span> <span class="n">dispatch_queue_create</span><span class="p">(</span><span class="s">&quot;banana&quot;</span><span class="p">,</span> <span class="n">DISPATCH_QUEUE_SERIAL</span><span class="p">);</span>
<span class="c1">//通过set_target_queue，将其指定为另一个目标队列。可以为全局、主队列，也可以为另一个用户队列。最终的用户队列实际上都是指向到全局队列的。</span>
<span class="c1">//使用set_target_queue，我们可以这样，比如设置队列A的目标队列是B，那么队列A可以看做B的子队列，当我挂起B队列后，A也将被挂起</span>
<span class="c1">//从而可以方便组织与管理各种队列。</span>
<span class="n">dispatch_set_target_queue</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="n">dispatch_get_global_queue</span><span class="p">(</span><span class="n">DISPATCH_QUEUE_PRIORITY_LOW</span><span class="p">,</span> <span class="mi">0</span><span class="p">));</span>
<span class="n">dispatch_sync</span><span class="p">(</span><span class="n">queue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
    <span class="n">NSLog</span><span class="p">(</span><span class="s">@&quot;in block&quot;</span><span class="p">);</span>
<span class="p">});</span>
</pre></div>