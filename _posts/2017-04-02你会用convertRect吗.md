---
layout: post
title:  你会用convertRect吗
tag: 技巧
date: 2017-04-02
--- 

### 一句话介绍convertRect方法
* 从父视图转换操作视图坐标到目标视图

```
- (CGPoint)convertPoint:(CGPoint)point toView:(nullable UIView *)view;
- (CGPoint)convertPoint:(CGPoint)point fromView:(nullable UIView *)view;
- (CGRect)convertRect:(CGRect)rect toView:(nullable UIView *)view;
- (CGRect)convertRect:(CGRect)rect fromView:(nullable UIView *)view;

```
很多次用到此方法的时候总是很迷惑，并不知道第一个参数是什么。虽然后面两个参数很容易理解，于是乎有了几种不同的猜测，但是每次都猜错。终于又一次遇到了，正好接着日更的方式重新攻克这个疑惑以便下次再遇到不会再迷惑了，其实这些方法用更好理解的设计应该是：

```
- (CGPoint)superview_convertPoint:(CGPoint)point toView:(nullable UIView *)view;
- (CGPoint)superview_convertPoint:(CGPoint)point fromView:(nullable UIView *)view;
- (CGRect)superview_convertRect:(CGRect)rect toView:(nullable UIView *)view;
- (CGRect)superview_convertRect:(CGRect)rect fromView:(nullable UIView *)view;

```

是的，这样就不迷惑了不知道用什么了，因为绝大多数想要的方式都是基于上层视图做操作的，如果不存在上层视图这个view就成了无根之草木了。


## 应用场景

>* 点击图片，从原地放大效果，如图片预览
>* 半透明遮罩中镂空，选表情预览，被操作的视图转移至顶层，如下图
>


![图片](http://7xicym.com1.z0.glb.clouddn.com/popaimg/day2_convertrect.png)
