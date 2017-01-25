---
title: 不再安全的 OSSpinLock
tags:
  - iOS
  - 技术
date: 2016-01-16 00:25:01
---

<span class="s1">昨天有位开发者在</span><span class="s2"> Github </span><span class="s1">上给我提了一个</span><span class="s2"> [issue](https://github.com/ibireme/YYModel/issues/43)</span><span class="s1">，里面指出</span><span class="s2"> OSSpinLock </span><span class="s1">在新版</span><span class="s2"> iOS </span><span class="s1">中已经不能再保证安全了，并提供了几个相关资料的链接。我仔细查了一下相关资料，确认了这个让人不爽的 bug。</span>

## <span class="s2">OSSpinLock </span><span class="s1">的问题</span>

<span class="s3">2015-12-14 </span><span class="s2">那天，</span>[<span class="s3">swift-dev </span>](https://lists.swift.org/pipermail/swift-dev/Week-of-Mon-20151214/000372.html)<span class="s2">[邮件列表里](https://lists.swift.org/pipermail/swift-dev/Week-of-Mon-20151214/000372.html)有人在讨论</span><span class="s3"> weak </span><span class="s2">属性的线程安全问题，其中有几位苹果工程师透露了自旋锁的 bug，对话内容大致如下：</span>

<span class="s2">新版</span><span class="s3"> iOS </span><span class="s2">中，系统维护了</span><span class="s3"> 5 </span><span class="s2">个不同的线程优先级</span><span class="s3">/QoS: background</span><span class="s2">，</span><span class="s3">utility</span><span class="s2">，</span><span class="s3">default</span><span class="s2">，</span><span class="s3">user-initiated</span><span class="s2">，</span><span class="s3">user-interactive</span><span class="s2">。高优先级线程始终会在低优先级线程前执行，一个线程不会受到比它更低优先级线程的干扰。这种线程调度算法会产生潜在的优先级反转问题，从而破坏了</span><span class="s3"> spin lock</span><span class="s2">。</span>

<span class="s2">具体来说，如果一个低优先级的线程获得锁并访问共享资源，这时一个高优先级的线程也尝试获得这个锁，它会处于</span><span class="s3"> spin lock </span><span class="s2">的忙等状态从而占用大量</span><span class="s3"> CPU</span><span class="s2">。此时低优先级线程无法与高优先级线程争夺</span><span class="s3"> CPU </span><span class="s2">时间，从而导致任务迟迟完不成、无法释放</span><span class="s3"> lock</span><span class="s2">。这并不只是理论上的问题，</span><span class="s3">libobjc </span><span class="s2">已经遇到了很多次这个问题了，于是苹果的工程师停用了</span><span class="s3"> OSSpinLock</span><span class="s2">。</span>

<span class="s2">苹果工程师</span><span class="s3"> Greg Parker </span><span class="s2">提到，对于这个问题，一种解决方案是用</span><span class="s3"> truly unbounded backoff </span><span class="s2">算法，这能避免</span><span class="s3"> livelock </span><span class="s2">问题，但如果系统负载高时，它仍有可能将高优先级的线程阻塞数十秒之久；另一种方案是使用</span><span class="s3"> handoff lock </span><span class="s2">算法，这也是</span><span class="s3"> libobjc </span><span class="s2">目前正在使用的。锁的持有者会把线程</span><span class="s3"> ID </span><span class="s2">保存到锁内部，锁的等待者会临时贡献出它的优先级来避免优先级反转的问题。理论上这种模式会在比较复杂的多锁条件下产生问题，但实践上目前还一切都好。</span>

<span class="s3">libobjc </span><span class="s2">里用的是</span><span class="s3"> Mach </span><span class="s2">内核的</span><span class="s3"> thread_switch() </span><span class="s2">然后传递了一个</span><span class="s3"> mach thread port </span><span class="s2">来避免优先级反转，另外它还用了一个私有的参数选项，所以开发者无法自己实现这个锁。另一方面，由于二进制兼容问题，</span><span class="s3">OSSpinLock </span><span class="s2">也不能有改动。</span>

<span class="s2">最终的结论就是，除非开发者能保证访问锁的线程全部都处于同一优先级，否则</span><span class="s3"> iOS </span><span class="s2">系统中所有类型的自旋锁都不能再使用了。</span>

## <span class="s2">OSSpinLock 的替代方案</span>

<span class="s1">为了找到一个替代方案，我做了一个简单的性能测试，对比了一下几种能够替代</span><span class="s2"> OSSpinLock </span><span class="s1">锁的性能。测试是在</span><span class="s2"> iPhone6</span><span class="s1">、</span><span class="s2">iOS9 </span><span class="s1">上跑的，代码在[这里](https://github.com/ibireme/tmp/blob/master/iOSLockBenckmark/iOSLockBenckmark/ViewController.m)</span><span class="s1">。我尝试了不同的循环次数，结果并不都一样，我猜这可能是与</span><span class="s2"> CPU Cache </span><span class="s1">有关，所以这个结果只能当作一个定性分析。</span>

[![lock_benchmark](http://blog.ibireme.com/wp-content/uploads/2016/01/lock_benchmark.png)](http://blog.ibireme.com/wp-content/uploads/2016/01/lock_benchmark.png)

<span class="s1">可以看到除了</span><span class="s2"> OSSpinLock </span><span class="s1">外，</span><span class="s2">dispatch_semaphore </span><span class="s1">和</span><span class="s2"> pthread_mutex </span><span class="s1">性能是最高的。有[消息](http://mjtsai.com/blog/2015/12/16/osspinlock-is-unsafe/)</span><span class="s1">称，苹果在新系统中已经优化了</span><span class="s2"> pthread_mutex </span><span class="s1">的性能，所以它看上去和</span><span class="s2"> OSSpinLock </span><span class="s1">差距并没有那么大了。</span>

## 开源社区的反应

**<span class="s1" style="color: #99cc00;">苹果</span>**

<span class="s1">查看 CoreFoundation 的源码能够发现，苹果至少在</span><span class="s2"> 2014 </span><span class="s1">年就发现了这个问题，并把</span><span class="s2"> CoreFoundation </span><span class="s1">中的</span><span class="s2"> spinlock </span><span class="s1">替换成了</span><span class="s2"> pthread_mutex</span><span class="s1">，具体变化可以查看这两个文件：[CFInternal.h(855.17)](http://www.opensource.apple.com/source/CF/CF-855.17/CFInternal.h)、[CFInternal.h(1151.16)](http://www.opensource.apple.com/source/CF/CF-1151.16/CFInternal.h)。</span><span class="s2">苹果自己发现问题后，并没有更新</span><span class="s3"> OSSpinLock </span><span class="s2">的文档，也没有告知开发者，这有些让人失望。</span>

<span class="s2" style="color: #99cc00;">Google</span>

<span class="s2">google/</span><span class="s2">protobuf </span><span class="s1">内部的</span><span class="s2"> spinlock 被全部</span><span class="s1">替换为</span><span class="s2"> dispatch_semaphore</span><span class="s1">，详情可以看这个提交：[https://github.com/google/protobuf/pull/1060](https://github.com/google/protobuf/pull/1060)。用 dispatch_semaphore 而不用 pthread_mutex 应该是出于性能考虑。</span>

<span style="color: #99cc00;">其他项目</span>

因为 OSSpinLock 出现这种问题的几率很小，也没有引起很大的重视，我所能找到的也只有 [ReactiveCocoa ](https://github.com/ReactiveCocoa/ReactiveCocoa/issues/2619)在讨论这个问题。

## 相关链接

[https://lists.swift.org/pipermail/swift-dev/Week-of-Mon-20151214/000344.html](https://lists.swift.org/pipermail/swift-dev/Week-of-Mon-20151214/000344.html)

[http://mjtsai.com/blog/2015/12/16/osspinlock-is-unsafe/](http://mjtsai.com/blog/2015/12/16/osspinlock-is-unsafe/)

[http://engineering.postmates.com/Spinlocks-Considered-Harmful-On-iOS/](http://engineering.postmates.com/Spinlocks-Considered-Harmful-On-iOS/)

[https://twitter.com/steipete/status/676851647042203648](https://twitter.com/steipete/status/676851647042203648)