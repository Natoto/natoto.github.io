---
title: Injection Plugin for Xcode
tags: []
date: 2014-06-30 13:50:37
---

![Alt text](/2014-03-19/banner.png)

# 介绍

Injection Plugin For Xcode 是 Xcode 上的一个插件。利用它可以修改应用代码，实时在模拟器或实机上看到效果而不需要重启应用。

# 安装

[点此下载](http://injectionforxcode.johnholdsworth.com/InjectionPluginV5.1.pkg) Injection Plugin for Xcode
安装后，重启Xcode，会发现在 Product 菜单下多了两个选项：
![001](/2014-03-19/001.png)

点击 Product &gt; 你的工程名 &gt; Patch Project for Injection 选项, 之后插件会在 Prefix.pch 和 main.m 中插入两段代码。这不会影响程序原有代码，如果要还原，随时可以通过点击 Revert Injection’s Changes 选项来还原。
![002](/2014-03-19/002.png)

# 基本使用

我们做一个很简单的应用，其有一个 UIButton 和一个 UILabel，当点击 button 后，label 显示一段文本，ViewController 的代码如下：

<div class="codehilite"><pre><span class="k">@interface</span> <span class="nc">ViewController</span> <span class="p">()</span>
<span class="k">@property</span> <span class="p">(</span><span class="n">weak</span><span class="p">,</span> <span class="n">nonatomic</span><span class="p">)</span> <span class="kt">IBOutlet</span> <span class="n">UILabel</span> <span class="o">*</span><span class="n">label</span><span class="p">;</span>
<span class="k">@end</span>

<span class="k">@implementation</span> <span class="nc">ViewController</span>

<span class="k">-</span> <span class="p">(</span><span class="kt">IBAction</span><span class="p">)</span><span class="nf">buttonTouched:</span><span class="p">(</span><span class="kt">id</span><span class="p">)</span><span class="nv">sender</span>
<span class="p">{</span>
    <span class="n">self</span><span class="p">.</span><span class="n">label</span><span class="p">.</span><span class="n">text</span> <span class="o">=</span> <span class="s">@&quot;阿布上班不为了钱&quot;</span><span class="p">;</span>
<span class="p">}</span>
<span class="k">@end</span>
</pre></div>

运行后，点击按钮，效果如图所示：
![003](/2014-03-19/003.png)

之后我们修改代码，将赋给 label 的字符串改为：

<div class="codehilite"><pre><span class="n">self</span><span class="p">.</span><span class="n">label</span><span class="p">.</span><span class="n">text</span> <span class="o">=</span> <span class="s">@&quot;阿布钱多到花不完&quot;</span><span class="p">;</span>
</pre></div>

但区别于一般的使用 CMD+R 来重新编译并运行程序，这次我们使用 control= 这个快捷键来注入。你会发现代码上方出现一个进度条：
![004](/2014-03-19/004.png)

注入完成后，修改的类的代码就生效了，点击模拟器中应用的按钮试试。
![005](/2014-03-19/005.png)

# 实时参数调整

Injection Plugin 还提供了5个变量和5个颜色，分别存在插件提供的全局数组变量 INParameters 和 INColors 中。我们可以在程序使用这两个数组变量，并可以在程序运行过程中实时修改。
我们建立个新工程，这一次，我们通过修改插件提供的一个颜色参数，实时修改应用中 View 的背景色。代码如下：

<div class="codehilite"><pre><span class="k">@implementation</span> <span class="nc">ViewController</span>

<span class="k">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">viewDidLoad</span>
<span class="p">{</span>
    <span class="p">[</span><span class="n">super</span> <span class="n">viewDidLoad</span><span class="p">];</span>
    <span class="p">[</span><span class="n">NSTimer</span> <span class="n">scheduledTimerWithTimeInterval</span><span class="o">:</span><span class="mf">0.1</span>
                                     <span class="nl">target:</span><span class="n">self</span>
                                   <span class="nl">selector:</span><span class="k">@selector</span><span class="p">(</span><span class="n">changeColor</span><span class="p">)</span>
                                   <span class="nl">userInfo:</span><span class="nb">nil</span>
                                    <span class="nl">repeats:</span><span class="nb">YES</span><span class="p">];</span>
<span class="p">}</span>

<span class="k">-</span> <span class="p">(</span><span class="kt">void</span><span class="p">)</span><span class="nf">changeColor</span>
<span class="p">{</span>
    <span class="n">self</span><span class="p">.</span><span class="n">view</span><span class="p">.</span><span class="n">backgroundColor</span> <span class="o">=</span> <span class="n">INColors</span><span class="p">[</span><span class="mi">0</span><span class="p">];</span>
<span class="p">}</span>
<span class="k">@end</span>
</pre></div>

运行程序，之后点击 Product &gt; 你的工程名 &gt; Tunable App Parameters 选项。
![006](/2014-03-19/006.png)

点击第一个颜色，试着调整颜色，看看模拟器发生了什么。
![007](/2014-03-19/007.gif)

# 真机调试

真机调试涉及到证书问题，需要告诉 bundle project 正确的证书。可以通过在工程文件中添加以下 RunScript 实现：

<div class="codehilite"><pre><span class="nb">echo</span> <span class="s2">&quot;$CODESIGNING_FOLDER_PATH&quot;</span> &gt;/tmp/<span class="s2">&quot;$USER.ident&quot;</span> <span class="o">&amp;&amp;</span> <span class="nb">echo</span> <span class="s2">&quot;$CODE_SIGN_IDENTITY&quot;</span> &gt;&gt;/tmp/<span class="s2">&quot;$USER.ident&quot;</span> <span class="o">&amp;&amp;</span> <span class="nb">exit</span>;
</pre></div>

具体操作如下：
![008](/2014-03-19/008.gif)

之后就可以正确在真机上使用了。如果依然出现证书错误，尝试删除工程文件夹里的 iOSInjectionProject 目录。

# 结尾

最后，例如 storyboard injection 这些 Xcode 5 上已经失效的功能就不介绍了。如果想要了解更多，请访问
[Injection Plugin for Xcode 的 Github 页面](https://github.com/johnno1962/injectionforxcode)
阿布最高！