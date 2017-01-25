---
title: iOS JSON 模型转换库评测
tags:
  - iOS
  - 技术
date: 2015-10-23 17:11:22
---

iOS 开发中总会用到各种 JSON 模型转换库，这篇文章将会对常见的几个开源库进行一下评测。评测的内容主要集中在性能、功能、容错性这几个方面。

## 评测的对象：

<span style="color: #ff6600;">Manually</span>

手动进行 JSON/Model 转换，不用任何开源库，可以进行高效、自由的转换，但手写代码非常繁琐，而且容易出错。

<span style="color: #ff6600;">YYModel</span>

我造的一个新轮子，比较轻量（算上 .h 只有 5 个文件），支持自动的 JSON/Model 转换，支持定义映射过程。API 简洁，功能也比较简单。

<span style="color: #ff6600;">FastEasyMapping</span>

Yalantis 开发的一个 JSON 模型转换库，可以自定义详细的 Model 映射过程，支持 CoreData。使用者较少。

<span style="color: #ff6600;">JSONModel</span>

一个 JSON 模型转换库，有着比较简洁的接口。Model 需要继承自 JSONModel。

<span style="color: #ff6600;">Mantle</span>

Github 官方团队开发的 JSON 模型转换库，Model 需要继承自 MTLModel。功能丰富，文档完善，使用广泛。

<span style="color: #ff6600;">MJExtension</span>

国内开发者"小码哥"开发的 JSON 模型库，号称性能超过 JSONModel 和 Mantle，使用简单无侵入。国内有大量使用者。

<span id="more-41804"></span>

## 性能评测：

所有开源库代码更新至 2015-09-18，以 Release 方式编译，运行在 iPhone 6 上，代码见 [https://github.com/ibireme/YYModel/tree/master/Benchmark](https://github.com/ibireme/YYModel/tree/master/Benchmark)。

<span style="color: #ff6600;">用例1：GithubUser</span>

从 https://api.github.com/users/facebook 获取的一条 [User](https://github.com/ibireme/YYModel/blob/master/Benchmark/ModelBenchmark/user.json) 数据，去除 NSDate 属性。

该 JSON 有 30 行，大部分属性是 string，少量是 number。这个用例主要是测试最基础的 Model 相关操作。

每次测试执行 10000 次，统计耗时毫秒数。

[![yymodel_benchmark_1](http://blog.ibireme.com/wp-content/uploads/2015/10/yymodel_benchmark_1.png)](http://blog.ibireme.com/wp-content/uploads/2015/10/yymodel_benchmark_1.png)

<span style="color: #ff6600;">用例2: WeiboStatus</span>

从官方微博 App 抓取一条内容完整的[微博数据](https://github.com/ibireme/YYModel/blob/master/Benchmark/ModelBenchmark/weibo.json)，JSON 总共有 580 行（是的，一条微博需要这么大数据量），包含大量嵌套对象、容器对象、类型转换、日期解析等。这个用例主要是测试在复杂的情况下不同库的性能。

每次测试执行 1000 次，统计耗时毫秒数。

[![yymodel_benchmark_2](http://blog.ibireme.com/wp-content/uploads/2015/10/yymodel_benchmark_2.png)](http://blog.ibireme.com/wp-content/uploads/2015/10/yymodel_benchmark_2.png)

测试结果如下：

Mantle 在各个测试中，性能都是最差的

JSONModel 和 MJExtension 性能相差不多，但都比 Mantle 性能高。

FastEasyMapping 相对来说性能确实比较快。

YYModel 性能高出其他几个库一个数量级，接近手写代码的效率。

FastEasyMapping 不支持 NSCoding 协议，所以不能进行 Archive 的性能测试。

MJExtension 在处理复杂对象转为 JSON 时，存在错误。

(此处我也测试了一些 Swift 的项目，例如 ObjectMapper、JSONHelper、ModelRocket，性能比 Mantle 还差很多，这里就不进行对比了。)

&nbsp;

## 容错性：

容错性主要是测试在默认情况下，当 JSON 格式错误时，Model 框架是否会产生错误结果或造成 Crash。

<table>
<colgroup>
<col width="24%" /></colgroup>
<thead>
<tr>
<th>用例</th>
<th>YYModel</th>
<th>FastEasyMapping</th>
<th>JSONModel</th>
<th>Mantle</th>
<th>MJExtension</th>
</tr>
</thead>
<tbody>
<tr>
<td>JSON 属性是 number

Model 属性是 NSString</td>
<td>✅ NSString</td>
<td>🚫 NSNumber</td>
<td>✅ NSString</td>
<td>⚠️ model nil</td>
<td>✅ NSString</td>
</tr>
<tr>
<td>JSON 属性是 string "100"

Model 属性是 int</td>
<td>✅ 100</td>
<td>🚫 Crash</td>
<td>🚫 Crash</td>
<td>⚠️ model nil</td>
<td>✅ 100</td>
</tr>
<tr>
<td>JSON 属性是 string "2009-04-02T03:35:22Z"

Model 属性是 NSDate</td>
<td>✅ NSDate</td>
<td>🚫 NSString</td>
<td>✅ NSDate</td>
<td>⚠️ model nil</td>
<td>🚫 NSString</td>
</tr>
<tr>
<td>JSON 属性是 string

Model 属性是 NSValue</td>
<td>✅ nil</td>
<td>🚫 NSString</td>
<td>🚫 crash</td>
<td>⚠️ model nil</td>
<td>🚫 NSString</td>
</tr>
</tbody>
</table>

YYModel 和 Mantle 都会进行对象类型检查，避免将错误的对象类型赋值到属性，以避免潜在的 Crash 问题。不同的是 YYModel 会尝试自动转换，转换失败时留空；而 Mantle 遇到类型不匹配时，直接把错误向上返回，从而终止了整个转换过程，但这么做更方便调试。

MJExtension 会对部分对象进行自动转换（比如 NSString 和 NSNumber 之间的转换），但当自动转换不能完成时，它会直接把 JSON 对象赋值给类型不匹配的 Model 属性。这样的结果会导致稍后 Model 在使用时，造成潜在的 Crash 风险。

JSONModel 并没有对错误类型的检测，并且没有对 App 的保护，当出现异常时，会导致整个 App Crash，非常危险。

FastEasyMapping 表现则是最差的，它没有自动转换的机制，当遇到类型不匹配时，会导致错误的类型赋值，甚至直接 Crash。

&nbsp;

## 功能：

<table>
<colgroup>
<col width="24%" /></colgroup>
<thead>
<tr>
<th>功能</th>
<th>YYModel</th>
<th>FastEasyMapping</th>
<th>JSONModel</th>
<th>Mantle</th>
<th>MJExtension</th>
</tr>
</thead>
<tbody>
<tr>
<td>相同属性名自动映射</td>
<td>✅</td>
<td>🚫</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>自定义属性转换方式</td>
<td>🚫</td>
<td>✅</td>
<td>🚫</td>
<td>✅</td>
<td>🚫</td>
</tr>
<tr>
<td>NSCoding</td>
<td>✅</td>
<td>🚫</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>hash/equal</td>
<td>✅</td>
<td>🚫</td>
<td>✅</td>
<td>✅</td>
<td>🚫</td>
</tr>
<tr>
<td>CoreData</td>
<td>🚫</td>
<td>✅</td>
<td>🚫</td>
<td>✅</td>
<td>✅</td>
</tr>
</tbody>
</table>

就功能来说，Mantle 的可定制性最高，功能相对比较丰富。

YYModel、JSONModel、MJExtension 使用比较简单，但功能相对 Mantle 稍弱。

FastEasyMapping 功能最少，使用也不算方便。

## 侵入性：

Mantle 和 JSONModel 都需要 Model 继承自某个基类，灵活性稍差，但功能丰富。

YYModel、MJExtension 都是采用 Category 方式来实现功能，比较灵活，无侵入。

但注意 MJExtension 为 NSObject/NSString 添加了一些没有前缀的方法，且方法命名比较通用，可能会和一个工程内的其他类有冲突。

FastEasyMapping 采用工具类来实现 Model 转换的功能，最为灵活，但使用很不方便。

## 结论：

如果需要一个稳定、功能强大的 Model 框架，Mantle 是最佳选择，它唯一的缺点就是性能比较差。

如果对功能要求并不多，但对性能有更高要求时，可以试试我的 YYModel。

Swift 相关的几个库性能都比较差，非 Swift 项目不推荐使用。

最后提一句，如果对性能、网络流量等有更高的要求，就不要再用 JSON 了，建议改用 protobuf/FlatBuffers 这样的方案。JSON 转换再怎么优化，在性能和流量方面还是远差于二进制格式的。

## 附: YYModel 性能优化的几个 Tip：

1\. 缓存

Model JSON 转换过程中需要很多类的元数据，如果数据足够小，则全部缓存到内存中。

2\. 查表

当遇到多项选择的条件时，要尽量使用查表法实现，比如 switch/case，C Array，如果查表条件是对象，则可以用 NSDictionary 来实现。

3\. 避免 KVC

Key-Value Coding 使用起来非常方便，但性能上要差于直接调用 Getter/Setter，所以如果能避免 KVC 而用 Getter/Setter 代替，性能会有较大提升。

4\. 避免 Getter/Setter 调用

如果能直接访问 ivar，则尽量使用 ivar 而不要使用 Getter/Setter 这样也能节省一部分开销。

5\. 避免多余的内存管理方法

在 ARC 条件下，默认声明的对象是 __strong 类型的，赋值时有可能会产生 retain/release 调用，如果一个变量在其生命周期内不会被释放，则使用 __unsafe_unretained 会节省很大的开销。

访问具有 __weak 属性的变量时，实际上会调用 objc_loadWeak() 和 objc_storeWeak() 来完成，这也会带来很大的开销，所以要避免使用 __weak 属性。

创建和使用对象时，要尽量避免对象进入 autoreleasepool，以避免额外的资源开销。

6\. 遍历容器类时，选择更高效的方法

相对于 Foundation 的方法来说，CoreFoundation 的方法有更高的性能，用 CFArrayApplyFunction() 和 CFDictionaryApplyFunction() 方法来遍历容器类能带来不少性能提升，但代码写起来会非常麻烦。

7\. 尽量用纯 C 函数、内联函数

使用纯 C 函数可以避免 ObjC 的消息发送带来的开销。如果 C 函数比较小，使用 inline 可以避免一部分压栈弹栈等函数调用的开销。

8\. 减少遍历的循环次数

在 JSON 和 Model 转换前，Model 的属性个数和 JSON 的属性个数都是已知的，这时选择数量较少的那一方进行遍历，会节省很多时间。