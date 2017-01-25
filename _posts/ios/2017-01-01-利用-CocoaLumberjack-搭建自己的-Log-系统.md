---
title: 利用 CocoaLumberjack 搭建自己的 Log 系统
tags: []
date: 2015-02-15 15:12:01
---

一直需要一个 Log 系统，可以将程序运行过程中打的 log 发送到自己服务器，方便之后数据分析或者除错。之前也尝试过找一些第三方服务，但看来看去，国内貌似没看到专门做这一块的，而国外看了下有 [Loggly](https://www.loggly.com/)，似乎满足需求，但它要收费且日志保存时间太短。后来无意间看了下 [Loggly](https://www.loggly.com/) 提供的 SDK 源代码，发现了 [CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 这个好东西，而 [Loggly](https://www.loggly.com/) 其也不过就是在 [CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 上自定义了 Logger 和 Formatter 而已。自己做的话，也很简单。

先说下需求，我理想中的 Log 系统需要：

1.  可以设定 Log 等级
2.  可以积攒到一定量的 log 后，一次性发送给服务器，绝对不能打一个 Log 就发一次
3.  可以一定时间后，将未发送的 log 发送到服务器
4.  可以在 App 切入后台时将未发送的 log 发送到服务器

其他一些需求，比如可以远程设定发送 log 的等级阀值，还有阀值的有效期等，和本文无关就不写了。

开始动手前，先了解下 [CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 是什么：

[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 最早是由 [Robbie Hanson](https://github.com/robbiehanson) 开发的日志库，可以在 iOS 和 MacOSX 开发上使用。其简单，快读，强大又不失灵活。它自带了几种log方式，分别是:

*   DDASLLogger 将 log 发送给苹果服务器，之后在 Console.app 中可以查看
*   DDTTYLogger 将 log 发送给 Xcode 的控制台
*   DDFileLogger 讲 log 写入本地文件

[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 打一个 log 的流程大概就是这样的：
![Header](/%E5%88%A9%E7%94%A8CocoaLumberjack%E6%90%AD%E5%BB%BA%E8%87%AA%E5%B7%B1%E7%9A%84Log%E7%B3%BB%E7%BB%9F/001.png)

所有的 log 都会发给 DDLog 对象，其运行在自己的一个GCD队列(GlobalLoggingQueue)，之后，DDLog 会将 log 分发给其下注册的一个或多个 Logger，这步在多核下是并发的，效率很高。每个 Logger 处理收到的 log 也是在它们自己的 GCD队列下（loggingQueue）做的，它们询问其下的 Formatter，获取 Log 消息格式，然后最终根据 Logger 的逻辑，将 log 消息分发到不同的地方。

因为一个 DDLog 可以把 log 分发到所有其下注册的 Logger 下，也就是说一个 log 可以同时打到控制台，打到远程服务器，打到本地文件，相当灵活。

[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 支持 Log 等级：

<div class="codehilite"><pre><span class="k">typedef</span> <span class="nf">NS_OPTIONS</span><span class="p">(</span><span class="bp">NSUInteger</span><span class="p">,</span> <span class="n">DDLogFlag</span><span class="p">)</span> <span class="p">{</span>
    <span class="n">DDLogFlagError</span>      <span class="o">=</span> <span class="p">(</span><span class="mi">1</span> <span class="o">&lt;&lt;</span> <span class="mi">0</span><span class="p">),</span> <span class="c1">// 0...00001</span>
    <span class="n">DDLogFlagWarning</span>    <span class="o">=</span> <span class="p">(</span><span class="mi">1</span> <span class="o">&lt;&lt;</span> <span class="mi">1</span><span class="p">),</span> <span class="c1">// 0...00010</span>
    <span class="n">DDLogFlagInfo</span>       <span class="o">=</span> <span class="p">(</span><span class="mi">1</span> <span class="o">&lt;&lt;</span> <span class="mi">2</span><span class="p">),</span> <span class="c1">// 0...00100</span>
    <span class="n">DDLogFlagDebug</span>      <span class="o">=</span> <span class="p">(</span><span class="mi">1</span> <span class="o">&lt;&lt;</span> <span class="mi">3</span><span class="p">),</span> <span class="c1">// 0...01000</span>
    <span class="n">DDLogFlagVerbose</span>    <span class="o">=</span> <span class="p">(</span><span class="mi">1</span> <span class="o">&lt;&lt;</span> <span class="mi">4</span><span class="p">)</span>  <span class="c1">// 0...10000</span>
<span class="p">};</span>
<span class="k">typedef</span> <span class="nf">NS_ENUM</span><span class="p">(</span><span class="bp">NSUInteger</span><span class="p">,</span> <span class="n">DDLogLevel</span><span class="p">)</span> <span class="p">{</span>
    <span class="n">DDLogLevelOff</span>       <span class="o">=</span> <span class="mi">0</span><span class="p">,</span>
    <span class="n">DDLogLevelError</span>     <span class="o">=</span> <span class="p">(</span><span class="n">DDLogFlagError</span><span class="p">),</span>                       <span class="c1">// 0...00001</span>
    <span class="n">DDLogLevelWarning</span>   <span class="o">=</span> <span class="p">(</span><span class="n">DDLogLevelError</span>   <span class="o">|</span> <span class="n">DDLogFlagWarning</span><span class="p">),</span> <span class="c1">// 0...00011</span>
    <span class="n">DDLogLevelInfo</span>      <span class="o">=</span> <span class="p">(</span><span class="n">DDLogLevelWarning</span> <span class="o">|</span> <span class="n">DDLogFlagInfo</span><span class="p">),</span>    <span class="c1">// 0...00111</span>
    <span class="n">DDLogLevelDebug</span>     <span class="o">=</span> <span class="p">(</span><span class="n">DDLogLevelInfo</span>    <span class="o">|</span> <span class="n">DDLogFlagDebug</span><span class="p">),</span>   <span class="c1">// 0...01111</span>
    <span class="n">DDLogLevelVerbose</span>   <span class="o">=</span> <span class="p">(</span><span class="n">DDLogLevelDebug</span>   <span class="o">|</span> <span class="n">DDLogFlagVerbose</span><span class="p">),</span> <span class="c1">// 0...11111</span>
    <span class="n">DDLogLevelAll</span>       <span class="o">=</span> <span class="n">NSUIntegerMax</span>                           <span class="c1">// 1111....11111 (DDLogLevelVerbose plus any other flags)</span>
<span class="p">};</span>
</pre></div>

DDLogLevel 定义了全局的 log 等级，DDLogFlag 是我们打 log 时设定的 log 等级，CocoaLumberjack 会比较两者，如果 flag 低于 level，则不会打 log：

<div class="codehilite"><pre><span class="cp">#define LOG_MAYBE(async, lvl, flg, ctx, tag, fnct, frmt, ...) \</span>
<span class="cp">        do { if(lvl &amp; flg) LOG_MACRO(async, lvl, flg, ctx, tag, fnct, frmt, ##__VA_ARGS__); } while(0)</span>
</pre></div>

DDLogger 协议定义了 logger 对象需要遵从的方法和变量，为了方便使用，其提供了 DDAbstractLogger 对象，我们只需要继承该对象就可以自定义自己的 logger。对于第二点和第三点需求，我们可以利用 DDAbstractDatabaseLogger，其也是继承自 DDAbstractLogger，并在其上定义了 saveThreshold, saveInterval 等控制参数。这个 logger 本身是针对写入数据库的 log 设计的，我们也可以利用它这几个参数，实现我们上面所提的需求的第二和第三点。

对于第二点，设定 _saveThreshold 值即可，比如如果希望积攒1000条 log 再一次性发送，就赋值 1000.
对于第三点，设定 _saveInterval，比如如果希望每分钟发送一次，就设定 60.

由此，[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 已经实现了需求中的 1、2、3 点，我们要做的无非是自定义 Logger 和 Formatter，将 log 的最终去处改为发送到我们自己的服务器中。

而第四点，我们可以监听 UIApplicationWillResignActiveNotification 事件，当触发时，手动调用 logger 的 db_save 方法，发送数据给服务器。

废话了半天，现在看下实现。

首先我们设定 log 的消息结构。自定义一个 LogFormatter, 遵从 DDLogFormatter 协议，我们需要重写 formatLogMessage 这个方法，这个方法返回值是 NSString，就是最终 log 的消息体字符串。而输入参数 logMessage 是由 logger 发的一个 DDLogMessage 对象，包含了一些必要的信息：

<div class="codehilite"><pre><span class="k">@interface</span> <span class="nc">DDLogMessage</span> : <span class="bp">NSObject</span> <span class="o">&lt;</span><span class="bp">NSCopying</span><span class="o">&gt;</span>
<span class="p">{</span>
    <span class="c1">// Direct accessors to be used only for performance</span>
    <span class="k">@public</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_message</span><span class="p">;</span>
    <span class="n">DDLogLevel</span> <span class="n">_level</span><span class="p">;</span>
    <span class="n">DDLogFlag</span> <span class="n">_flag</span><span class="p">;</span>
    <span class="bp">NSUInteger</span> <span class="n">_context</span><span class="p">;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_file</span><span class="p">;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_fileName</span><span class="p">;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_function</span><span class="p">;</span>
    <span class="bp">NSUInteger</span> <span class="n">_line</span><span class="p">;</span>
    <span class="kt">id</span> <span class="n">_tag</span><span class="p">;</span>
    <span class="n">DDLogMessageOptions</span> <span class="n">_options</span><span class="p">;</span>
    <span class="bp">NSDate</span> <span class="o">*</span><span class="n">_timestamp</span><span class="p">;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_threadID</span><span class="p">;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_threadName</span><span class="p">;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">_queueLabel</span><span class="p">;</span>
<span class="p">}</span>
</pre></div>

可以利用这些信息构建自己的 log 消息体。比如我们这里只需要 log 所在文件名，行数还有所在函数名，则可以这样写：

<div class="codehilite"><pre><span class="p">-</span> <span class="p">(</span><span class="bp">NSString</span> <span class="o">*</span><span class="p">)</span><span class="nf">formatLogMessage:</span><span class="p">(</span><span class="n">DDLogMessage</span> <span class="o">*</span><span class="p">)</span><span class="nv">logMessage</span><span class="p">{</span>
    <span class="bp">NSMutableDictionary</span> <span class="o">*</span><span class="n">logDict</span> <span class="o">=</span> <span class="p">[</span><span class="bp">NSMutableDictionary</span> <span class="n">dictionary</span><span class="p">];</span>

    <span class="c1">//取得文件名</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">locationString</span><span class="p">;</span>
    <span class="bp">NSArray</span> <span class="o">*</span><span class="n">parts</span> <span class="o">=</span> <span class="p">[</span><span class="n">logMessage</span><span class="o">-&gt;</span><span class="n">_file</span> <span class="nl">componentsSeparatedByString</span><span class="p">:</span><span class="s">@&quot;/&quot;</span><span class="p">];</span>
    <span class="k">if</span> <span class="p">([</span><span class="n">parts</span> <span class="n">count</span><span class="p">]</span> <span class="o">&gt;</span> <span class="mi">0</span><span class="p">)</span>
        <span class="n">locationString</span> <span class="o">=</span> <span class="p">[</span><span class="n">parts</span> <span class="n">lastObject</span><span class="p">];</span>
    <span class="k">if</span> <span class="p">([</span><span class="n">locationString</span> <span class="n">length</span><span class="p">]</span> <span class="o">==</span> <span class="mi">0</span><span class="p">)</span>
        <span class="n">locationString</span> <span class="o">=</span> <span class="s">@&quot;No file&quot;</span><span class="p">;</span>

    <span class="c1">//这里的格式: {&quot;location&quot;:&quot;myfile.m:120(void a::sub(int)&quot;}， 文件名，行数和函数名是用的编译器宏 __FILE__, __LINE__, __PRETTY_FUNCTION__</span>
    <span class="n">logDict</span><span class="p">[</span><span class="s">@&quot;location&quot;</span><span class="p">]</span> <span class="o">=</span> <span class="p">[</span><span class="bp">NSString</span> <span class="nl">stringWithFormat</span><span class="p">:</span><span class="s">@&quot;%@:%lu(%@)&quot;</span><span class="p">,</span> <span class="n">locationString</span><span class="p">,</span> <span class="p">(</span><span class="kt">unsigned</span> <span class="kt">long</span><span class="p">)</span><span class="n">logMessage</span><span class="o">-&gt;</span><span class="n">_line</span><span class="p">,</span> <span class="n">logMessage</span><span class="o">-&gt;</span><span class="n">_function</span><span class="p">]</span>

    <span class="c1">//尝试将logDict内容转为字符串，其实这里可以直接构造字符串，但真实项目中，肯定需要很多其他的信息，不可能仅仅文件名、行数和函数名就够了的。</span>
    <span class="bp">NSError</span> <span class="o">*</span><span class="n">error</span><span class="p">;</span>
    <span class="bp">NSData</span> <span class="o">*</span><span class="n">outputJson</span> <span class="o">=</span> <span class="p">[</span><span class="bp">NSJSONSerialization</span> <span class="nl">dataWithJSONObject</span><span class="p">:</span><span class="n">logfields</span> <span class="nl">options</span><span class="p">:</span><span class="mi">0</span> <span class="nl">error</span><span class="p">:</span><span class="o">&amp;</span><span class="n">error</span><span class="p">];</span>
    <span class="k">if</span> <span class="p">(</span><span class="n">error</span><span class="p">)</span>
        <span class="k">return</span> <span class="s">@&quot;{</span><span class="se">\&quot;</span><span class="s">location</span><span class="se">\&quot;</span><span class="s">:</span><span class="se">\&quot;</span><span class="s">error</span><span class="se">\&quot;</span><span class="s">}&quot;</span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">jsonString</span> <span class="o">=</span> <span class="p">[[</span><span class="bp">NSString</span> <span class="n">alloc</span><span class="p">]</span> <span class="nl">initWithData</span><span class="p">:</span><span class="n">outputJson</span> <span class="nl">encoding</span><span class="p">:</span><span class="n">NSUTF8StringEncoding</span><span class="p">];</span>
    <span class="k">if</span> <span class="p">(</span><span class="n">jsonString</span><span class="p">)</span>
        <span class="k">return</span> <span class="n">jsonString</span><span class="p">;</span>
    <span class="k">return</span> <span class="s">@&quot;{</span><span class="se">\&quot;</span><span class="s">location</span><span class="se">\&quot;</span><span class="s">:</span><span class="se">\&quot;</span><span class="s">error</span><span class="se">\&quot;</span><span class="s">}&quot;</span>
<span class="p">}</span>
</pre></div>

接下来自定义 logger，其继承自 DDAbstractDatabaseLogger。在初始化方法中，先设定好一些参数，以及添加一个UIApplicationWillResignActiveNotification的观察者，用以实现第四个需求。

<div class="codehilite"><pre><span class="p">-</span> <span class="p">(</span><span class="kt">instancetype</span><span class="p">)</span><span class="nf">init</span> <span class="p">{</span>
    <span class="nb">self</span> <span class="o">=</span> <span class="p">[</span><span class="nb">super</span> <span class="n">init</span><span class="p">];</span>
    <span class="k">if</span> <span class="p">(</span><span class="nb">self</span><span class="p">)</span> <span class="p">{</span>
        <span class="nb">self</span><span class="p">.</span><span class="n">deleteInterval</span> <span class="o">=</span> <span class="mi">0</span><span class="p">;</span>
        <span class="nb">self</span><span class="p">.</span><span class="n">maxAge</span> <span class="o">=</span> <span class="mi">0</span><span class="p">;</span>
        <span class="nb">self</span><span class="p">.</span><span class="n">deleteOnEverySave</span> <span class="o">=</span> <span class="nb">NO</span><span class="p">;</span>
        <span class="nb">self</span><span class="p">.</span><span class="n">saveInterval</span> <span class="o">=</span> <span class="mi">60</span><span class="p">;</span>
        <span class="nb">self</span><span class="p">.</span><span class="n">saveThreshold</span> <span class="o">=</span> <span class="mi">500</span><span class="p">;</span>

        <span class="c1">//别忘了在 dealloc 里 removeObserver</span>
        <span class="p">[[</span><span class="bp">NSNotificationCenter</span> <span class="n">defaultCenter</span><span class="p">]</span> <span class="nl">addObserver</span><span class="p">:</span><span class="nb">self</span>
                                                 <span class="nl">selector</span><span class="p">:</span><span class="k">@selector</span><span class="p">(</span><span class="n">saveOnSuspend</span><span class="p">)</span>
                                                     <span class="nl">name</span><span class="p">:</span><span class="s">@&quot;UIApplicationWillResignActiveNotification&quot;</span>
                                                   <span class="nl">object</span><span class="p">:</span><span class="nb">nil</span><span class="p">];</span>
    <span class="p">}</span>
    <span class="k">return</span> <span class="nb">self</span><span class="p">;</span>
<span class="p">}</span>

<span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">saveOnSuspend</span> <span class="p">{</span>
    <span class="n">dispatch_async</span><span class="p">(</span><span class="n">_loggerQueue</span><span class="p">,</span> <span class="o">^</span><span class="p">{</span>
        <span class="p">[</span><span class="nb">self</span> <span class="n">db_save</span><span class="p">];</span>
    <span class="p">});</span>
<span class="p">}</span>
</pre></div>

每次打 log 时，db_log: 会被调用，我们在这个函数里，将 log 发给 formatter，将返回的 log 消息体字符串保存在缓冲中。 db_log 的返回值告诉 DDLog 该条 log 是否成功保存进缓存。

<div class="codehilite"><pre><span class="p">-</span> <span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nf">db_log:</span><span class="p">(</span><span class="n">DDLogMessage</span> <span class="o">*</span><span class="p">)</span><span class="nv">logMessage</span>
<span class="p">{</span>
    <span class="k">if</span> <span class="p">(</span><span class="o">!</span><span class="n">_logFormatter</span><span class="p">)</span> <span class="p">{</span>
        <span class="c1">//没有指定 formatter</span>
        <span class="k">return</span> <span class="nb">NO</span><span class="p">;</span>
    <span class="p">}</span>

    <span class="k">if</span> <span class="p">(</span><span class="o">!</span><span class="n">_logMessagesArray</span><span class="p">)</span>
        <span class="n">_logMessagesArray</span> <span class="o">=</span> <span class="p">[</span><span class="bp">NSMutableArray</span> <span class="nl">arrayWithCapacity</span><span class="p">:</span><span class="mi">500</span><span class="p">];</span> <span class="c1">// 我们的saveThreshold只有500，所以一般情况下够了</span>

    <span class="k">if</span> <span class="p">([</span><span class="n">_logMessagesArray</span> <span class="n">count</span><span class="p">]</span> <span class="o">&gt;</span> <span class="mi">2000</span><span class="p">)</span> <span class="p">{</span>
        <span class="c1">// 如果段时间内进入大量log，并且迟迟发不到服务器上，我们可以判断哪里出了问题，在这之后的 log 暂时不处理了。</span>
        <span class="c1">// 但我们依然要告诉 DDLog 这个存进去了。</span>
        <span class="k">return</span> <span class="nb">YES</span><span class="p">;</span>
    <span class="p">}</span>

    <span class="c1">//利用 formatter 得到消息字符串，添加到缓存</span>
    <span class="p">[</span><span class="n">_logMessagesArray</span> <span class="nl">addObject</span><span class="p">:[</span><span class="n">_logFormatter</span> <span class="nl">formatLogMessage</span><span class="p">:</span><span class="n">logMessage</span><span class="p">]];</span>
    <span class="k">return</span> <span class="nb">YES</span><span class="p">;</span>
<span class="p">}</span>
</pre></div>

当1分钟或者未写入 log 数达到 500 时， db_save 就会被调用，我们在这里，将缓存的数据上传到自己的服务器。

<div class="codehilite"><pre><span class="p">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">db_save</span><span class="p">{</span>
    <span class="c1">//判断是否在 logger 自己的GCD队列中</span>
    <span class="k">if</span> <span class="p">(</span><span class="o">!</span><span class="p">[</span><span class="nb">self</span> <span class="n">isOnInternalLoggerQueue</span><span class="p">])</span>
        <span class="n">NSAssert</span><span class="p">(</span><span class="nb">NO</span><span class="p">,</span> <span class="s">@&quot;db_saveAndDelete should only be executed on the internalLoggerQueue thread, if you&#39;re seeing this, your doing it wrong.&quot;</span><span class="p">);</span>

    <span class="c1">//如果缓存内没数据，啥也不做</span>
    <span class="k">if</span> <span class="p">([</span><span class="n">_logMessagesArray</span> <span class="n">count</span><span class="p">]</span> <span class="o">==</span> <span class="mi">0</span><span class="p">)</span>
        <span class="k">return</span><span class="p">;</span>

    <span class="err">获取缓存中所有数据，之后将缓存清空</span>
    <span class="bp">NSArray</span> <span class="o">*</span><span class="n">oldLogMessagesArray</span> <span class="o">=</span> <span class="p">[</span><span class="n">_logMessagesArray</span> <span class="k">copy</span><span class="p">];</span>
    <span class="n">_logMessagesArray</span> <span class="o">=</span> <span class="p">[</span><span class="bp">NSMutableArray</span> <span class="nl">arrayWithCapacity</span><span class="p">:</span><span class="mi">0</span><span class="p">];</span>

    <span class="c1">//用换行符，把所有的数据拼成一个大字符串 </span>
    <span class="bp">NSString</span> <span class="o">*</span><span class="n">logMessagesString</span> <span class="o">=</span> <span class="p">[</span><span class="n">oldLogMessagesArray</span> <span class="nl">componentsJoinedByString</span><span class="p">:</span><span class="s">@&quot;</span><span class="se">\n</span><span class="s">&quot;</span><span class="p">];</span>

    <span class="c1">//发送给咱自己服务器(自己实现了)</span>
    <span class="p">[</span><span class="nb">self</span> <span class="nl">post</span><span class="p">:</span><span class="n">logMessagesString</span><span class="p">];</span>
<span class="p">}</span>
</pre></div>

最后，我们需要在程序某处定义全局 log 等级（我这里使用 Info），并在 AppDelegate 的 didFinishLaunchingWithOptions 里初始化所有 Log 相关的东西：

<div class="codehilite"><pre><span class="k">static</span> <span class="bp">NSUInteger</span> <span class="n">LOG_LEVEL_DEF</span> <span class="o">=</span> <span class="n">DDLogLevelInfo</span><span class="p">;</span>

<span class="p">-</span> <span class="p">(</span><span class="kt">BOOL</span><span class="p">)</span><span class="nf">application:</span><span class="p">(</span><span class="bp">UIApplication</span> <span class="o">*</span><span class="p">)</span><span class="nv">application</span> <span class="nf">didFinishLaunchingWithOptions:</span><span class="p">(</span><span class="bp">NSDictionary</span> <span class="o">*</span><span class="p">)</span><span class="nv">launchOptions</span>
<span class="p">{</span>
    <span class="n">MyLogger</span> <span class="o">*</span><span class="n">logger</span> <span class="o">=</span> <span class="p">[</span><span class="n">MyLogger</span> <span class="n">new</span><span class="p">];</span>
    <span class="p">[</span><span class="n">logger</span> <span class="nl">setLogFormatter</span><span class="p">:[</span><span class="n">MyLogFormatter</span> <span class="n">new</span><span class="p">]];</span>
    <span class="p">[</span><span class="n">DDLog</span> <span class="nl">addLogger</span><span class="p">:</span><span class="n">logger</span><span class="p">];</span>
    <span class="c1">//....</span>
<span class="p">}</span>
</pre></div>

然后就可以利用 DDLogError, DDLogWarning 等宏在程序中打 log 了。使用方法与 NSLog 一样。这几个宏的定义：

<div class="codehilite"><pre><span class="c1">//注意，DDLogError 是肯定同步的</span>
<span class="cp">#define DDLogError(frmt, ...) LOG_MAYBE(NO, LOG_LEVEL_DEF, DDLogFlagError, 0, nil, __PRETTY_FUNCTION__, frmt, ##__VA_ARGS__)</span>
<span class="cp">#define DDLogWarn(frmt, ...) LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagWarning, 0, nil, __PRETTY_FUNCTION__, frmt, ##__VA_ARGS__)</span>
<span class="cp">#define DDLogInfo(frmt, ...) LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagInfo, 0, nil, __PRETTY_FUNCTION__, frmt, ##__VA_ARGS__)</span>
<span class="cp">#define DDLogDebug(frmt, ...) LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagDebug, 0, nil, __PRETTY_FUNCTION__, frmt, ##__VA_ARGS__)</span>
<span class="cp">#define DDLogVerbose(frmt, ...) LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagVerbose, 0, nil, __PRETTY_FUNCTION__, frmt, ##__VA_ARGS__)</span>
</pre></div>

最后感谢 [CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack) 的作者 [Robbie Hanson](https://github.com/robbiehanson) ，如果你喜欢他开发的库，比如 [XMPPFramework](https://github.com/robbiehanson/XMPPFramework)，别忘了帮他[买杯啤酒](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=UZRA26JPJB3DA)哦~