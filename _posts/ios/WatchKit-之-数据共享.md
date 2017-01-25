---
title: WatchKit 之 数据共享
tags: []
date: 2014-11-20 16:51:53
---

本文将介绍如何使 Watch App 与 iOS App 之间进行数据共享

# App Group

App Group 是一个 App 与其扩展均可以访问的本地文件系统的一块区域。由于 Watch App 与 iOS App 是在不同的沙盒环境下运行，正常情况下他们彼此无法分享数据，因此，我们需要创建一个 App Group，使的它们拥有一个共享的文件区域。

点击项目，在 target 里分别打开项目本身和 Watch App 的 App Groups，点击加号，添加一个 App Group，输入一个唯一的标识符。我们之后会在 Watch App 和 iOS App 中通过该标识符访问同一个 App Group。

![image](/WatchKitShareData/001.png)

# NSUserDefault

不同于平时使用 defaultUserDefault，在这里我们需要指定 app group，使得 Watch App 与 iOS App 可以分享用户设置。我们使用 initWithSuiteName: 方法，其参数就是 app group identifier

<div class="codehilite"><pre><span class="k">if</span> <span class="k">let</span> <span class="nl">userDefault</span><span class="p">:</span><span class="bp">NSUserDefaults</span> <span class="o">=</span> <span class="bp">NSUserDefaults</span><span class="p">(</span><span class="nl">suiteName</span><span class="p">:</span> <span class="s">&quot;group.watchShareData.container&quot;</span><span class="p">)</span> <span class="p">{</span>
    <span class="k">let</span> <span class="n">value</span> <span class="o">=</span> <span class="n">userDefault</span><span class="p">.</span><span class="n">integerForKey</span><span class="p">(</span><span class="s">&quot;shareInt&quot;</span><span class="p">)</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">labelValue</span><span class="p">.</span><span class="n">setText</span><span class="p">(</span><span class="s">&quot;\(value)&quot;</span><span class="p">)</span>
<span class="p">}</span>
</pre></div>

运行效果:
![image](/WatchKitShareData/002.gif)

# 文件

通过 NSFileManager 的 containerURLForSecurityApplicationGroupIdentifier 方法，获得一个共享 app group 的目录。在这个目录下的文件可以在 Watch App 与 iOS App 中读写访问。
在 iOS App 中，我们使用一个 imagePicker，点击图片后就将图片保存到该共享目录。

<div class="codehilite"><pre><span class="p">@</span><span class="kt">IBAction</span> <span class="k">func</span> <span class="n">shareImageButtonTouched</span><span class="p">(</span><span class="nl">sender</span><span class="p">:</span> <span class="n">AnyObject</span><span class="p">)</span> <span class="p">{</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">imagePicker</span> <span class="o">=</span> <span class="bp">UIImagePickerController</span><span class="p">()</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">imagePicker</span><span class="p">.</span><span class="n">sourceType</span> <span class="o">=</span> <span class="p">.</span><span class="n">PhotoLibrary</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">imagePicker</span><span class="p">.</span><span class="n">delegate</span> <span class="o">=</span> <span class="nb">self</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">presentViewController</span><span class="p">(</span><span class="nb">self</span><span class="p">.</span><span class="n">imagePicker</span><span class="p">,</span> <span class="nl">animated</span><span class="p">:</span> <span class="nb">true</span><span class="p">,</span> <span class="nl">completion</span><span class="p">:</span> <span class="nb">nil</span><span class="p">)</span>
<span class="p">}</span>

<span class="k">func</span> <span class="n">imagePickerController</span><span class="p">(</span><span class="nl">picker</span><span class="p">:</span> <span class="bp">UIImagePickerController</span><span class="o">!</span><span class="p">,</span> <span class="n">didFinishPickingImage</span> <span class="nl">image</span><span class="p">:</span> <span class="bp">UIImage</span><span class="o">!</span><span class="p">,</span> <span class="nl">editingInfo</span><span class="p">:</span> <span class="p">[</span><span class="nl">NSObject</span> <span class="p">:</span> <span class="n">AnyObject</span><span class="p">]</span><span class="o">!</span><span class="p">)</span> <span class="p">{</span>
    <span class="k">if</span> <span class="k">let</span> <span class="n">dirURL</span> <span class="o">=</span> <span class="nb">self</span><span class="p">.</span><span class="n">getShareDirURL</span><span class="p">()</span> <span class="p">{</span>
    <span class="c1">//将图片文件写入共享目录</span>
        <span class="n">UIImagePNGRepresentation</span><span class="p">(</span><span class="n">image</span><span class="p">).</span><span class="n">writeToURL</span><span class="p">(</span><span class="n">dirURL</span><span class="p">.</span><span class="n">URLByAppendingPathComponent</span><span class="p">(</span><span class="s">&quot;image.png&quot;</span><span class="p">),</span> <span class="nl">atomically</span><span class="p">:</span> <span class="nb">true</span><span class="p">)</span>
    <span class="p">}</span>
    <span class="nb">self</span><span class="p">.</span><span class="n">dismissViewControllerAnimated</span><span class="p">(</span><span class="nb">true</span><span class="p">,</span> <span class="nl">completion</span><span class="p">:</span> <span class="nb">nil</span><span class="p">)</span>
<span class="p">}</span>

<span class="k">func</span> <span class="n">getShareDirURL</span><span class="p">()</span><span class="o">-&gt;</span><span class="bp">NSURL</span><span class="o">?</span><span class="p">{</span>
<span class="c1">//这里返回一个所属 App Group 的共享目录</span>
    <span class="k">return</span> <span class="bp">NSFileManager</span><span class="p">.</span><span class="n">defaultManager</span><span class="p">().</span><span class="n">containerURLForSecurityApplicationGroupIdentifier</span><span class="p">(</span><span class="s">&quot;group.watchShareData.container&quot;</span><span class="p">)</span>
<span class="p">}</span>
</pre></div>

在 Watch App 中，我们从该目录读取图片，并且展示

<div class="codehilite"><pre><span class="kr">override</span> <span class="k">func</span> <span class="nf">willActivate</span><span class="p">()</span> <span class="p">{</span>
    <span class="nb">super</span><span class="p">.</span><span class="n">willActivate</span><span class="p">()</span>

    <span class="k">if</span> <span class="k">let</span> <span class="n">dirURL</span> <span class="o">=</span> <span class="nb">self</span><span class="p">.</span><span class="n">getShareDirURL</span><span class="p">()</span> <span class="p">{</span>
        <span class="k">if</span> <span class="k">let</span> <span class="n">imageData</span> <span class="o">=</span> <span class="bp">NSData</span><span class="p">(</span><span class="nl">contentsOfURL</span><span class="p">:</span><span class="n">dirURL</span><span class="p">.</span><span class="n">URLByAppendingPathComponent</span><span class="p">(</span><span class="s">&quot;image.png&quot;</span><span class="p">))</span> <span class="p">{</span>
            <span class="nb">self</span><span class="p">.</span><span class="n">imageInterface</span><span class="p">.</span><span class="n">setImage</span><span class="p">(</span><span class="bp">UIImage</span><span class="p">(</span><span class="nl">data</span><span class="p">:</span> <span class="n">imageData</span><span class="p">))</span>
        <span class="p">}</span>
    <span class="p">}</span>
<span class="p">}</span>

<span class="k">func</span> <span class="n">getShareDirURL</span><span class="p">()</span> <span class="o">-&gt;</span> <span class="bp">NSURL</span><span class="o">?</span> <span class="p">{</span>
    <span class="k">return</span> <span class="bp">NSFileManager</span><span class="p">.</span><span class="n">defaultManager</span><span class="p">().</span><span class="n">containerURLForSecurityApplicationGroupIdentifier</span><span class="p">(</span><span class="s">&quot;group.watchShareData.container&quot;</span><span class="p">)</span>
<span class="p">}</span>
</pre></div>

运行效果:
![image](/WatchKitShareData/003.gif)

本文 Demo 工程 [github 地址](https://github.com/inonomori/WatchKitDataShareDemo)