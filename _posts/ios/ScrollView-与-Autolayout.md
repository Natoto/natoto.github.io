---
title: ScrollView 与 Autolayout
tags: []
date: 2014-11-16 01:08:43
---

初学 Autolayout，当涉及到 ScrollView 时，很多人面对满屏幕红色错误不知所措，为什么明明以前没问题的约束到了这儿就成了错误。

比如下面这种情况：

![image](/ScrollView%E4%B8%8EAutolayout/001.png)

一个蓝色的 UIView，设其长宽约束分别为 210,200。上、左和右间距为 55。如此设置这个 View 的位置就被确定了。没有错误，没有警告。

可同样的方法，到 UIScrollView 却有触目惊心的红色错误：

![image](/ScrollView%E4%B8%8EAutolayout/002.png)

可以看到 Storyboard 错误提示：ScrollView has ambiguous scrollable content height。这是怎么一回事呢？

我们知道，UIScrollView 有一个 contentSize 属性，其定义了 ScrollView 可滚动内容的大小。在以前用纯代码写的时候，我们会直接对这个属性赋值，定义其大小。但在 Autolayout 下，UIScrollView 的 contentSize 是由其内容的约束来定义的。因此，我们在 ScrollView 里面设置的约束，不仅起到布局内容的作用，同时也起到了定义 ScrollView 可滚动范围的作用。

针对上面的例子具体来说，ScrollView 知道它里面有个 View，其高度是 200，距离顶上为 55，但仅通过这两个约束没办法知道它的 contentSize 的高度是多少，我们缺少一个定义 View 到 ScrollView 底部距离的约束。

![image](/ScrollView%E4%B8%8EAutolayout/003.png)

我们添加这样的一个约束，值为 55。注意这里看着有点怪，这个约束看着很长，但其实它的值并不大。

![image](/ScrollView%E4%B8%8EAutolayout/004.png)

通过这个约束，ScrollView 现在可以得到其 contentSize 的高度了，即从顶端开始到 View 的间距 55，View 的高度 200，View 到底端间距 55。contentSize 的高也就是这些值的合：310。

另外要提的是，在这里我们给了 View 一个很明确的高度约束（200）。缺少这个约束，ScrollView 是无法得到 contentSize 的。但对于某些控件，例如 UILabel，UIImageView，它们的尺寸是可以通过其内容决定的。

![image](/ScrollView%E4%B8%8EAutolayout/005.png)

这种情况下，我们只需要上下左右的约束即可。但有时，他们的内容是运行时决定的，比如 UIImageView，如果它的图片是运行时动态从服务器下载的，那么我们就会放一个空的 UIImageView，不包含所显示的图片。可惜，这么做，错误又来了。

![image](/ScrollView%E4%B8%8EAutolayout/006.png)

由于未定义显示的图片，因此该 ImageView 的尺寸无法确定，所以 storyboard 傻傻地又抛出了错误。

那么除了随便放上一张图片以外，还有没有其他更正常的办法？

我们可以用一个临时的占位尺寸来告诉 storyboard，在你这里就按照这个尺寸走。这个占位尺寸仅在 storyboard 设计阶段有效，不会影响到运行时的尺寸。
通过修改 Intrinsic Size 为 Placeholder，现在错误没了。

![image](/ScrollView%E4%B8%8EAutolayout/007.png)

Autolayout 的使用是个熟能生巧的过程，相信每个人在一开始试着使用时，都会遇到满屏警告的情况。通过多实践，这种情况会慢慢得到改善最终避免出现。当你啪啪啪设置好约束，然后按一下 alt+cmd+= 后看着控件完全按照你想的样式去布局，也是蛮爽的。