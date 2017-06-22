---

layout: post
title: 机器学习概念
date: 2017-06-22
tag: 机器学习概念

---

### 机器学习概念

> 
Tom Mitchell provides a more modern definition: "A computer program is said to learn from experience E with respect to some class of tasks T and performance measure P, if its performance at tasks in T, as measured by P, improves with experience E."

#### 概念：一个程序被认为能从经验`E`中学习，解决任务 `T`，达到 性能度量值`P`，当且仅当, 有了经验E后，经过`P`评判， 程序在处理 `T` 时的性能有所提升


示例：玩跳棋。
>
- E =打很多棋子的经验
- T =玩跳棋的任务。
- P =程序将赢得下一场比赛的概率。

### 什么是监督学习 Supervised Learning
 
#### 概念：在监督学习中，我们获得了一个数据集，并且已经知道我们正确的输出应该是什么样子的，这意味着输入和输出之间有一个关系。

受监督的学习问题分为“回归”和“分类”问题。在回归问题中，我们试图在连续输出中预测结果，这意味着我们正在尝试将输入变量映射到某些连续函数。在分类问题中，我们试图用离散输出来预测结果。换句话说，我们正在尝试将输入变量映射到离散类别。

示例1：

给出关于房地产市场规模的数据，尝试预测房价。价格作为大小的函数是连续的输出，所以这是一个回归问题。

我们可以将这个例子变成一个分类问题，而不是让我们的产出是关于房子“卖出多于还是低于要价”。在这里，我们将房价分为两类。

示例2：

（a）回归 - 鉴于一个人的照片，我们必须根据给定的图片来预测他们的年龄

（b）分类 - 鉴于肿瘤患者，我们必须预测肿瘤是恶性还是良性。

### 什么是无监督学习
无监督学习

#### 概念：无监督的学习使我们能够很少或不知道我们的结果应该如何处理问题。 我们可以从数据中导出结构，我们不一定知道变量的影响。

我们可以通过基于数据中的变量之间的关系对数据进行聚类来导出该结构。

在无监督学习的情况下，没有基于预测结果的反馈。

例：
>
聚类：收集100万个不同的基因，并找到一种自动将这些基因组合成不同变量（如寿命，位置，作用等）相似或相关的组。
>
非聚类：“鸡尾酒会算法”，让您在混乱的环境中找到结构。 （即，从鸡尾酒会的声音网格中识别个体声音和音乐）。

### 参考资料：

- https://www.coursera.org/learn/machine-learning/supplement/aAgxl/what-is-machine-learning 

- https://www.coursera.org/learn/machine-learning/supplement/1O0Bk/unsupervised-learning

- [pdf课件下载](https://d3c33hcgiwev3.cloudfront.net/_974fa7509d583eabb592839f9716fe25_Lecture1.pdf?Expires=1498262400&Signature=QxSmAALlfrh-TI-QuTASj8sQ676ylvL35926XM3tpOcv01BUU~7xNWFnceuZIev7jwP84g6hJw91MYaw1X7WLP-Zs4yzgpSQ~Hd2EW8XJBYpzdvOsAdCLeNOGcV21d4yNrKeA5oDbycGixH8XmWoiZG~G6ykbUIAIVZXk4TQiQg_&Key-Pair-Id=APKAJLTNE6QMUY6HBC5A)

