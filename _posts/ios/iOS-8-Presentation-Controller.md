---
title: iOS 8 Presentation Controller
tags: []
date: 2014-09-21 09:08:20
---

本文搬运自 [Dative Studios](http://dativestudios.com/blog/2014/06/29/presentation-controllers/)，作者 [Pete Callaway](http://dativestudios.com/about/)。

iOS 8 新加入一个类：UIPresentationController，它与 iOS 7 新添加的几个类与协议一道，帮助我们方便快捷地实现 ViewController 的自定义过渡效果。我发现要搞懂一个新的 API，最快的方法还是写一个例子。废话不多说，上例子！

![Header](/2014-07-05/001.gif)

该项目在[GitHub](https://github.com/inonomori/iOS8PresentationController)可以下载

# 实现自定义过渡

我们需要两个对象来实现自定义过渡，一个 UIPresentationController 的子类以及一个遵从 UIViewControllerAnimatedTransitioning 协议的类。

我们的 UIPresentationController 的子类是负责「被呈现」及「负责呈现」的 controller 以外的 controller 的，看着很绕口，说白了，在我们的例子中，它负责的仅仅是那个带渐变效果的黑色半透明背景 View。

而 UIViewControllerAnimatedTransitioning 类将会负责「被呈现」的 ViewController 的过渡动画。

首先我们看 UIPresentationController

# UIPresentationController

在我们的 UIPresentationController 中，我们需要重写其中5个方法：

*   presentationTransitionWillBegin
*   presentationTransitionDidEnd:
*   dismissalTransitionWillBegin
*   dismissalTransitionDidEnd:
*   frameOfPresentedViewInContainerView

presentationTransitionWillBegin 是在呈现过渡即将开始的时候被调用的。我们在这个方法中把半透明黑色背景 View 加入到 containerView 中，并且做一个 alpha 从0到1的渐变过渡动画。

<div class="codehilite"><pre><span class="k">override</span> <span class="n">func</span> <span class="n">presentationTransitionWillBegin</span><span class="o">()</span> <span class="o">{</span>
    <span class="c1">// 添加半透明背景 View 到我们的视图结构中</span>
    <span class="n">self</span><span class="o">.</span><span class="n">dimmingView</span><span class="o">.</span><span class="n">frame</span> <span class="k">=</span> <span class="n">self</span><span class="o">.</span><span class="n">containerView</span><span class="o">.</span><span class="n">bounds</span>
    <span class="n">self</span><span class="o">.</span><span class="n">dimminView</span><span class="o">.</span><span class="n">alpha</span> <span class="k">=</span> <span class="mf">0.0</span>

    <span class="n">self</span><span class="o">.</span><span class="n">containerView</span><span class="o">.</span><span class="n">addSubview</span><span class="o">(</span><span class="n">self</span><span class="o">.</span><span class="n">dimmingView</span><span class="o">)</span>
    <span class="n">self</span><span class="o">.</span><span class="n">containerView</span><span class="o">.</span><span class="n">addSubview</span><span class="o">(</span><span class="n">self</span><span class="o">.</span><span class="n">presentedView</span><span class="o">())</span>

    <span class="c1">// 与过渡效果一起执行背景 View 的淡入效果</span>
    <span class="n">let</span> <span class="n">transitionCoordinator</span> <span class="k">=</span> <span class="n">self</span><span class="o">.</span><span class="n">presentingViewController</span><span class="o">.</span><span class="n">transitionCoordinator</span><span class="o">()</span>
    <span class="n">transitionCoordinator</span><span class="o">.</span><span class="n">animateAlongsideTransition</span><span class="o">({(</span><span class="n">context</span><span class="k">:</span> <span class="kt">UIViewControllerTransitionCoordinatorContext!</span><span class="o">)</span> <span class="o">-&gt;</span> <span class="nc">Void</span> <span class="n">in</span>
        <span class="n">self</span><span class="o">.</span><span class="n">dimmingView</span><span class="o">.</span><span class="n">alpha</span>  <span class="k">=</span> <span class="mf">1.0</span>
    <span class="o">},</span> <span class="n">completion</span><span class="k">:</span><span class="kt">nil</span><span class="o">)</span>
<span class="o">}</span>
</pre></div>

通过使用「负责呈现」的 controller 的 UIViewControllerTransitionCoordinator，我们可以确保我们的动画与其他动画一道儿播放。

presentationTransitionDidEnd: 是在呈现过渡结束时被调用的，并且该方法提供一个布尔变量来判断过渡效果是否完成。在我们的例子中，我们可以使用它在过渡效果已结束但没有完成时移除半透明的黑色背景 View。

<div class="codehilite"><pre><span class="k">override</span> <span class="n">func</span> <span class="n">presentationTransitionDidEnd</span><span class="o">(</span><span class="n">completed</span><span class="k">:</span> <span class="kt">Bool</span><span class="o">)</span>  <span class="o">{</span>
    <span class="c1">// 如果呈现没有完成，那就移除背景 View</span>
    <span class="k">if</span> <span class="o">!</span><span class="n">completed</span> <span class="o">{</span>
        <span class="n">self</span><span class="o">.</span><span class="n">dimmingView</span><span class="o">.</span><span class="n">removeFromSuperview</span><span class="o">()</span>
    <span class="o">}</span>
<span class="o">}</span>
</pre></div>

以上就涵盖了我们的背景 View 的呈现部分，我们现在需要给它添加淡出动画并且在它消失后移除它。正如你预料的那样，dismissalTransitionWillBegin 正是我们把它的 alpha 重新设回0的地方。

<div class="codehilite"><pre><span class="k">override</span> <span class="n">func</span> <span class="n">dismissalTransitionWillBegin</span><span class="o">()</span>  <span class="o">{</span>
    <span class="c1">// 与过渡效果一起执行背景 View 的淡出效果</span>
    <span class="n">let</span> <span class="n">transitionCoordinator</span> <span class="k">=</span> <span class="n">self</span><span class="o">.</span><span class="n">presentingViewController</span><span class="o">.</span><span class="n">transitionCoordinator</span><span class="o">()</span>
    <span class="n">transitionCoordinator</span><span class="o">.</span><span class="n">animateAlongsideTransition</span><span class="o">({(</span><span class="n">context</span><span class="k">:</span> <span class="kt">UIViewControllerTransitionCoordinatorContext!</span><span class="o">)</span> <span class="o">-&gt;</span> <span class="nc">Void</span> <span class="n">in</span>
        <span class="n">self</span><span class="o">.</span><span class="n">dimmingView</span><span class="o">.</span><span class="n">alpha</span>  <span class="k">=</span> <span class="mf">0.0</span>
    <span class="o">},</span> <span class="n">completion</span><span class="k">:</span><span class="kt">nil</span><span class="o">)</span>
<span class="o">}</span>
</pre></div>

我们还需要在消失完成后移除背景 View。做法与上面 presentationTransitionDidEnd: 类似，我们重载 dismissalTransitionDidEnd: 方法

<div class="codehilite"><pre><span class="k">override</span> <span class="n">func</span> <span class="n">dismissalTransitionDidEnd</span><span class="o">(</span><span class="n">completed</span><span class="k">:</span> <span class="kt">Bool</span><span class="o">)</span> <span class="o">{</span>
    <span class="c1">// 如果消失没有完成，那么把背景 View 移除</span>
    <span class="k">if</span> <span class="n">completed</span> <span class="o">{</span>
        <span class="n">self</span><span class="o">.</span><span class="n">dimmingView</span><span class="o">.</span><span class="n">removeFromSuperview</span><span class="o">()</span>
    <span class="o">}</span>
<span class="o">}</span>
</pre></div>

还有最后一个方法需要重载。在我们的自定义呈现中，被呈现的 view 并没有完全完全填充整个屏幕，而是很小的一个矩形。被呈现的 view 的过渡动画之后的最终位置，是由 UIPresentationViewController 来负责定义的。我们重载 frameOfPresentedViewInContainerView 方法来定义这个最终位置

<div class="codehilite"><pre><span class="k">override</span> <span class="n">func</span> <span class="n">frameOfPresentedViewInContainerView</span><span class="o">()</span> <span class="o">-&gt;</span> <span class="nc">CGRect</span> <span class="o">{</span>
    <span class="c1">// 我们可不希望被呈现的 View 占据了整个屏幕，所以我们调整他的frame</span>
    <span class="k">var</span> <span class="n">frame</span> <span class="k">=</span> <span class="n">self</span><span class="o">.</span><span class="n">containerView</span><span class="o">.</span><span class="n">bounds</span><span class="o">;</span>
    <span class="n">frame</span> <span class="k">=</span> <span class="nc">CGRectInset</span><span class="o">(</span><span class="n">frame</span><span class="o">,</span> <span class="mf">50.0</span><span class="o">,</span> <span class="mf">200.0</span><span class="o">)</span>

    <span class="k">return</span> <span class="n">frame</span>
<span class="o">}</span>
</pre></div>

最终完整的类可以[在此](https://github.com/inonomori/iOS8PresentationController/blob/master/PresentationControllers/CustomPresentationController.swift)浏览。

# UIViewControllerAnimatedTransitioning

我之前已经在[上一篇博文](http://nonomori.farbox.com/post/ios-7-jiao-hu-shi-guo-du)中提到了 UIViewControllerAnimatedTransitioning 协议的使用。感谢 iOS 8 新加入的 UIPresentationController， 我们的 UIViewControllerAnimatedTransitioning 类可以比之前少做一些事了，现在，它只负责与呈现相关的 ViewController 的 View 的动画了，其他额外的 View 一概再管了，比如我们的黑色背景 View。

我们需要实现两个协议方法

*   transitionDuration:
*   animatedTransition:

我们还需要放一个类的 property，这样我们可以在类的初始化方法中定义它，用来区别我们到底是让 ViewController 呈现还是消失。

transitionDuration: 方法比较简单，我们要做的仅仅是返回一个动画持续时长。

在 animateTransition: 方法中，我们给被呈现的 view 添加呈现与消失的动画。

<div class="codehilite"><pre><span class="n">func</span> <span class="n">animateTransition</span><span class="o">(</span><span class="n">transitionContext</span><span class="k">:</span> <span class="kt">UIViewControllerContextTransitioning!</span><span class="o">)</span>  <span class="o">{</span>
    <span class="k">if</span> <span class="n">isPresenting</span> <span class="o">{</span>
        <span class="n">animatePresentationWithTransitionContext</span><span class="o">(</span><span class="n">transitionContext</span><span class="o">)</span>
    <span class="o">}</span>
    <span class="k">else</span> <span class="o">{</span>
        <span class="n">animateDismissalWithTransitionContext</span><span class="o">(</span><span class="n">transitionContext</span><span class="o">)</span>
    <span class="o">}</span>
<span class="o">}</span>
</pre></div>
<div class="codehilite"><pre><span class="n">func</span> <span class="n">animatePresentationWithTransitionContext</span><span class="o">(</span><span class="n">transitionContext</span><span class="k">:</span> <span class="kt">UIViewControllerContextTransitioning</span><span class="o">)</span> <span class="o">{</span>
    <span class="n">let</span> <span class="n">presentedController</span> <span class="k">=</span> <span class="n">transitionContext</span><span class="o">.</span><span class="n">viewControllerForKey</span><span class="o">(</span><span class="nc">UITransitionContextToViewControllerKey</span><span class="o">)</span>
    <span class="n">let</span> <span class="n">presentedControllerView</span> <span class="k">=</span> <span class="n">transitionContext</span><span class="o">.</span><span class="n">viewForKey</span><span class="o">(</span><span class="nc">UITransitionContextToViewKey</span><span class="o">)!</span>
    <span class="n">let</span> <span class="n">containerView</span> <span class="k">=</span> <span class="n">transitionContext</span><span class="o">.</span><span class="n">containerView</span><span class="o">()!</span>

    <span class="c1">// 设定被呈现的 view 一开始的位置，在屏幕下方</span>
    <span class="n">presentedControllerView</span><span class="o">.</span><span class="n">frame</span> <span class="k">=</span> <span class="n">transitionContext</span><span class="o">.</span><span class="n">finalFrameForViewController</span><span class="o">(</span><span class="n">presentedController</span><span class="o">)</span>
    <span class="n">presentedControllerView</span><span class="o">.</span><span class="n">frame</span><span class="o">.</span><span class="n">origin</span><span class="o">.</span><span class="n">y</span> <span class="k">=</span> <span class="n">containerView</span><span class="o">.</span><span class="n">bounds</span><span class="o">.</span><span class="n">size</span><span class="o">.</span><span class="n">height</span>

    <span class="n">containerView</span><span class="o">.</span><span class="n">addSubview</span><span class="o">(</span><span class="n">presentedControllerView</span><span class="o">)</span>

    <span class="c1">// 添加一个动画，让被呈现的 view 移动到最终位置，我们使用0.6的damping值让动画有一种duang-duang的感觉……</span>
    <span class="nc">UIView</span><span class="o">.</span><span class="n">animateWithDuration</span><span class="o">(</span><span class="n">transitionDuration</span><span class="o">(</span><span class="n">transitionContext</span><span class="o">),</span> <span class="n">delay</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">0</span><span class="o">,</span> <span class="n">usingSpringWithDamping</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">6</span><span class="o">,</span> <span class="n">initialSpringVelocity</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">0</span><span class="o">,</span> <span class="n">options</span><span class="k">:</span> <span class="kt">.AllowUserInteraction</span><span class="o">,</span> <span class="n">animations</span><span class="k">:</span> <span class="o">{</span>
        <span class="kt">presentedControllerView.center.y</span> <span class="o">=</span> <span class="kt">containerView.bounds.size.height/</span><span class="err">2</span>
    <span class="o">},</span> <span class="n">completion</span><span class="k">:</span> <span class="o">{(</span><span class="kt">completed:</span> <span class="kt">Bool</span><span class="o">)</span> <span class="kt">-&gt;</span> <span class="kt">Void</span> <span class="kt">in</span>
        <span class="kt">transitionContext.completeTransition</span><span class="o">(</span><span class="kt">completed</span><span class="o">)</span>
    <span class="o">})</span>
<span class="o">}</span>

<span class="n">func</span> <span class="n">animateDismissalWithTransitionContext</span><span class="o">(</span><span class="n">transitionContext</span><span class="k">:</span> <span class="kt">UIViewControllerContextTransitioning</span><span class="o">)</span> <span class="o">{</span>
    <span class="n">let</span> <span class="n">presentedControllerView</span> <span class="k">=</span> <span class="n">transitionContext</span><span class="o">.</span><span class="n">viewForKey</span><span class="o">(</span><span class="nc">UITransitionContextFromViewKey</span><span class="o">)!</span>
    <span class="n">let</span> <span class="n">containerView</span> <span class="k">=</span> <span class="n">transitionContext</span><span class="o">.</span><span class="n">containerView</span><span class="o">()!</span>

    <span class="c1">// 添加一个动画，让要消失的 view 向下移动，离开屏幕</span>
    <span class="nc">UIView</span><span class="o">.</span><span class="n">animateWithDuration</span><span class="o">(</span><span class="n">transitionDuration</span><span class="o">(</span><span class="n">transitionContext</span><span class="o">),</span> <span class="n">delay</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">0</span><span class="o">,</span> <span class="n">usingSpringWithDamping</span><span class="k">:</span> <span class="err">1</span><span class="kt">.</span><span class="err">0</span><span class="o">,</span> <span class="n">initialSpringVelocity</span><span class="k">:</span> <span class="err">0</span><span class="kt">.</span><span class="err">0</span><span class="o">,</span> <span class="n">options</span><span class="k">:</span> <span class="kt">.AllowUserInteraction</span><span class="o">,</span> <span class="n">animations</span><span class="k">:</span> <span class="o">{</span>
        <span class="kt">presentedControllerView.frame.origin.y</span> <span class="o">=</span> <span class="kt">containerView.bounds.size.height</span>
    <span class="o">},</span> <span class="n">completion</span><span class="k">:</span> <span class="o">{(</span><span class="kt">completed:</span> <span class="kt">Bool</span><span class="o">)</span> <span class="kt">-&gt;</span> <span class="kt">Void</span> <span class="kt">in</span>
            <span class="kt">transitionContext.completeTransition</span><span class="o">(</span><span class="kt">completed</span><span class="o">)</span>
    <span class="o">})</span>
<span class="o">}</span>
</pre></div>

完整的类可以[在此](https://github.com/inonomori/iOS8PresentationController/blob/master/PresentationControllers/CustomPresentationAnimationController.swift)浏览。

# 使用自定义呈现类

我们已经实现了我们所需的实现自定义呈现的类。接下来我们看看怎么使用它们。事实上，有许多种不同的方法来使用它们，不过最简单的方法还是让被呈现的 ViewController 来作为自己的 UIViewControllerTransitioningDelegage

<div class="codehilite"><pre><span class="n">required</span> <span class="n">init</span><span class="o">(</span><span class="n">coder</span> <span class="n">aDecoder</span><span class="k">:</span> <span class="kt">NSCoder!</span><span class="o">)</span> <span class="o">{</span>
    <span class="k">super</span><span class="o">.</span><span class="n">init</span><span class="o">(</span><span class="n">coder</span><span class="k">:</span> <span class="kt">aDecoder</span><span class="o">)</span>
    <span class="n">self</span><span class="o">.</span><span class="n">commonInit</span><span class="o">()</span>
<span class="o">}</span>

<span class="k">override</span> <span class="n">init</span><span class="o">(</span><span class="n">nibName</span> <span class="n">nibNameOrNil</span><span class="k">:</span> <span class="kt">String!</span><span class="o">,</span> <span class="n">bundle</span> <span class="n">nibBundleOrNil</span><span class="k">:</span> <span class="kt">NSBundle!</span><span class="o">)</span>  <span class="o">{</span>
    <span class="k">super</span><span class="o">.</span><span class="n">init</span><span class="o">(</span><span class="n">nibName</span><span class="k">:</span> <span class="kt">nibNameOrNil</span><span class="o">,</span> <span class="n">bundle</span><span class="k">:</span> <span class="kt">nibBundleOrNil</span><span class="o">)</span>
    <span class="n">self</span><span class="o">.</span><span class="n">commonInit</span><span class="o">()</span>
<span class="o">}</span>

<span class="n">func</span> <span class="n">commonInit</span><span class="o">()</span> <span class="o">{</span>
    <span class="n">self</span><span class="o">.</span><span class="n">modalPresentationStyle</span> <span class="k">=</span> <span class="o">.</span><span class="nc">Custom</span>
    <span class="c1">//让被呈现 viewController 自己来作为自己的 transitioningDelegate</span>
    <span class="n">self</span><span class="o">.</span><span class="n">transitioningDelegate</span> <span class="k">=</span> <span class="n">self</span>
<span class="o">}</span>
</pre></div>

现在我们的 ViewController 就可以在呈现自己时，提供给我们一个 UIPresentationController 的实例了。

<div class="codehilite"><pre><span class="n">func</span> <span class="n">presentationControllerForPresentedViewController</span><span class="o">(</span><span class="n">presented</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">,</span> <span class="n">presentingViewController</span> <span class="n">presenting</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">,</span> <span class="n">sourceViewController</span> <span class="n">source</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">)</span> <span class="o">-&gt;</span> <span class="nc">UIPresentationController</span><span class="o">!</span> <span class="o">{</span>
    <span class="k">if</span> <span class="n">presented</span> <span class="o">==</span> <span class="n">self</span> <span class="o">{</span>
        <span class="k">return</span> <span class="nc">CustomPresentationController</span><span class="o">(</span><span class="n">presentedViewController</span><span class="k">:</span> <span class="kt">presented</span><span class="o">,</span> <span class="n">presentingViewController</span><span class="k">:</span> <span class="kt">presenting</span><span class="o">)</span>
    <span class="o">}</span>
    <span class="k">else</span> <span class="o">{</span>
        <span class="k">return</span> <span class="n">nil</span>
    <span class="o">}</span>
<span class="o">}</span>
</pre></div>

当然，还要有一个遵从了 UIViewControllerAnimatedTransitioning 协议的类的实例来负责动画

<div class="codehilite"><pre><span class="n">func</span> <span class="n">animationControllerForPresentedController</span><span class="o">(</span><span class="n">presented</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">,</span> <span class="n">presentingController</span> <span class="n">presenting</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">,</span> <span class="n">sourceController</span> <span class="n">source</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">)</span> <span class="o">-&gt;</span> <span class="nc">UIViewControllerAnimatedTransitioning</span><span class="o">!</span> <span class="o">{</span>
    <span class="k">if</span> <span class="n">presented</span> <span class="o">==</span> <span class="n">self</span> <span class="o">{</span>
        <span class="k">return</span> <span class="nc">CustomPresentationAnimationController</span><span class="o">(</span><span class="n">isPresenting</span><span class="k">:</span> <span class="kt">true</span><span class="o">)</span>
    <span class="o">}</span>
    <span class="k">else</span> <span class="o">{</span>
        <span class="k">return</span> <span class="n">nil</span>
    <span class="o">}</span>
<span class="o">}</span>

<span class="n">func</span> <span class="n">animationControllerForDismissedController</span><span class="o">(</span><span class="n">dismissed</span><span class="k">:</span> <span class="kt">UIViewController!</span><span class="o">)</span> <span class="o">-&gt;</span> <span class="nc">UIViewControllerAnimatedTransitioning</span><span class="o">!</span> <span class="o">{</span>
    <span class="k">if</span> <span class="n">dismissed</span> <span class="o">==</span> <span class="n">self</span> <span class="o">{</span>
        <span class="k">return</span> <span class="nc">CustomPresentationAnimationController</span><span class="o">(</span><span class="n">isPresenting</span><span class="k">:</span> <span class="kt">false</span><span class="o">)</span>
    <span class="o">}</span>
    <span class="k">else</span> <span class="o">{</span>
        <span class="k">return</span> <span class="n">nil</span>
    <span class="o">}</span>
<span class="o">}</span>
</pre></div>

完整的类可以[在此](https://github.com/inonomori/iOS8PresentationController/blob/master/PresentationControllers/MessageViewController.swift)浏览。

# 尾声

就像我[上篇博文](http://nonomori.farbox.com/post/ios-7-jiao-hu-shi-guo-du)中说的那样，希望这篇文章能帮你创建自己的自定义呈现效果。文中例子的工程文件已上传至 [GitHub](https://github.com/PeteC/PresentationControllers)。

本文搬运自 [Dative Studios](http://dativestudios.com/blog/2014/06/29/presentation-controllers/)，作者 [Pete Callaway](http://dativestudios.com/about/)。