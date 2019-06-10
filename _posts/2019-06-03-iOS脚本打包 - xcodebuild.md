---
layout: post
title: iOS脚本打包 - xcodebuild
tag: xcodebuild
date: 2019-06-03 
---


# iOS脚本打包 - xcodebuild

</div>
</div>
</div>
</div>
</header>

<article>
<div class="container">
<div class="row">

<div class="post-content col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
<div class="post-excerpt">

xcodebuild 和 xcrun 是 Xcode 为开发者提供的一套构建打包的命令。使用它们编写脚本，可以实现通过脚本自动化打包的功能。本文基于 Xcode9 ，xcrun 的打包工具被移除，因此笔者主要使用 xcodebuild 来完成打包工作。

</div>

在日常开发中，无论是提交给测试部测试还是最终打包上线，都需要将工程打包成 ipa 文件，通常我们是选定 Scheme ，然后在 Xcode 中点击『 Project - Archive 』，当整个工程 archive 后，在自动弹出的 『 Organizer 』 中点击『 Export 』，选择 Ad Hoc 或 App Store ，选择证书或自动签名，等待圈圈转完，导出到指定位置，才能得到里面的 ipa 文件。虽然 Xcode 完美地帮我们完成这一项工作，但其中我们还是需要点击 5 ~ 6 次。而使用脚本来构建打包，就只需要一个命令运行脚本，在等待脚本运行结束的时候，我们可以同时进行其他的工作。

同时，使用构建脚本也能更好地集成 CI 。

## [](#xcodebuild "xcodebuild")xcodebuild
> xcodebuild builds one or more targets contained in an Xcode project, or builds a scheme contained in an Xcode workspace or Xcode project.

`xcodebuild`是构建工具，可以将工程中的 target 或 scheme 编译、链接成 .app 文件。要使用`xcodebuild`，需要在`.xcodeproj`存放的文件夹中执行。

可以使用`man`来查看`xcodebuild`，可以看到该命令提供了一些常用概要( _SYNOPSIS_ )：


```
    xcodebuild [-project name.xcodeproj]
               [[-target targetname] ... | -alltargets]
               [-configuration configurationname]
               [-sdk [sdkfullpath | sdkname]] [action ...]
               [buildsetting=value ...] [-userdefault=value ...]

    xcodebuild [-project name.xcodeproj] -scheme schemename
               [[-destination destinationspecifier] ...]
               [-destination-timeout value]
               [-configuration configurationname]
               [-sdk [sdkfullpath | sdkname]] [action ...]
               [buildsetting=value ...] [-userdefault=value ...]

    xcodebuild -workspace name.xcworkspace -scheme schemename
               [[-destination destinationspecifier] ...]
               [-destination-timeout value]
               [-configuration configurationname]
               [-sdk [sdkfullpath | sdkname]] [action ...]
               [buildsetting=value ...] [-userdefault=value ...]

    xcodebuild -version [-sdk [sdkfullpath | sdkname]] [infoitem]

    xcodebuild -showsdks

    xcodebuild -showBuildSettings
               [-project name.xcodeproj | [-workspace name.xcworkspace -scheme schemename]]

    xcodebuild -list [-project name.xcodeproj | -workspace name.xcworkspace]

    xcodebuild -exportArchive -archivePath xcarchivepath -exportPath
                    destinationpath -exportOptionsPlist path

    xcodebuild -exportLocalizations -project name.xcodeproj -localizationPath path [[-exportLanguage language] ...]

    xcodebuild -importLocalizations -project name.xcodeproj -localizationPath path
    
``` 

前三条指令是比较常用的，其中涉及很多参数：


*   -project：指定要构建的 project ，当文件夹中有多个`.xcodeproj`文件时需要指定。
*   -target：指定构建哪一个 target 。默认地，若不指定此参数，xcodebuild 构建工程中的第一个 target 。
*   -alltargets：构建所有 target 。
*   -workspace：如果要构建一个 workspace （例如使用 cocoapods 管理第三方依赖文件），则需要指定 workspace ，当然后缀就是`.xcworkspace`。
*   -scheme：构建 workspace ，还必须指定 scheme ，使用此参数。
*   -destination：指定设备，如：`&#39;platform=OS X,arch=x86_64&#39;`指代当前 Mac 或`generic/platform=iOS`指定 Generic iOS device 。
*   -destination-timeout：搜索指定设备超时时间，默认 30S 。
*   -configuration：如果工程中没有添加其他配置，默认就是 Debug 和 Release 这两个版本。没有指定此参数和 scheme 参数，则默认为 Release 版本。
*   -arch：指定架构 armv7、armv7s、arm64 等。
*   -sdk：指定构建使用的 sdk ，后跟 sdk 的绝对路径或 sdk 名称，可通过`xcodebuild -showsdks`查看。
*   -list：查看工程的 target、configuration、scheme 。

    我们常用`xcodebuild`来构建项目，得到 .app 文件，但其实，`xcodebuild`也能打包出我们需要的 .ipa 文件，这就需要了解多以下几个比较重要的参数：

*   -exportArchive：archive 后导出，需要`-exportFormat` ，`-archivePath` 和`-exportPath`三个参数
*   -exportFormat：指定格式为 pkg ( macOS ) 或 ipa ( iOS ) 的一种
*   -archivePath：指定 archive 文件的地址，将此`.xcarchive`打包成 ipa
*   -exportPath：最后输出文件 ipa 所在的**文件夹**。
*   -exportOptionsPlist：plist 文件，其中定义了将`.xcarchive`导出成 ipa 所需要的配置参数。后面会说到。

    `xcodebuild`还能进行各种操作，挑选一些常用的来讲：

*   build：构建，默认操作。如果没有指定，则默认为 build ，将会在`SYMROOT`中生成文件夹`[configuration]-iphones`的文件夹（ configuration 见上述参数介绍）。其中有项目用到的第三方库的 framework 、`.app`文件、`.dSYM`文件。
*   archive：对应 Xcode 中的 Archive ，在 build 的基础上还将生成`.xcarchive`文件。
*   clean：对应 Xcode 中的 clean ，删除上次构建过程产生的中间文件。

    ## [](#xcrun "xcrun")xcrun
    <pre>`xcrun -sdk iphoneos PackageApplication &quot;./Release-iphoneos/${APP_NAME}.app&quot; -o ~/&quot;${IPANAME}&quot;
    `</pre>

    xcrun 更多地用来将app文件打包到 ipa 中，得以安装在用户的设备上。其中使用到 _PackageApplication_ 这个工具，命令也相对简单，就不多说了。

    需要注意的是：从 Xcode8.3 开始，_PackageApplication_ 从开发工具中被移除，因此我们用来将.app打包成ipa最常用的`xcrun`指令也变得不好用了。当然可以从旧版本的 Xcode 中将 _PackageApplication_ 拷贝一份放在新的 Xcode 中，让 _PackageApplication_ 继续发光发热。请见[stackoverflow](https://stackoverflow.com/questions/43068608/xcrun-error-unable-to-find-utility-packageapplication-not-a-developer-tool)。

    不过使用`xcrun`还可能存在一些问题：当解压 ipa 后，你会发现，在 app 文件中，`Payload`文件夹存在，但是`BCSymbolMaps`、`SwiftSupport` 和`Symbols`却找不到了，这有可能会在提交到 App Store 的时候出现问题。

    但是从 Xcode 中 Export xcarchive 则不会出现这样的问题，说明单纯使用 xcrun 的打包旧命令已经不被建议使用了。

    ## [](#Demonstration🌰 "Demonstration🌰")Demonstration🌰

    笔者在使用脚本打包的时候舍弃了 xcrun ，直接用 xcodebuild 来完成工作，提供一个示例：
    

```
    <pre>`# 工程名
    APP_NAME=&quot;KeyX_iOS&quot;
    # info.plist路径
    PROJECT_INFOPLIST_PATH=&quot;./${APP_NAME}/Supporting Files/Info.plist&quot;
    # exportOptions.plist路径
    EXPORT_PLIST=&quot;./KeyXExportOptions.plist&quot;
    echo &quot;==============some message==============&quot;
    echo &quot;info.plist路径 = ${PROJECT_INFOPLIST_PATH}&quot;
    # 取版本号
    BUNDLE_SHORT_VERSION=$(/usr/libexec/PlistBuddy -c &quot;print CFBundleShortVersionString&quot; &quot;${PROJECT_INFOPLIST_PATH}&quot;)
    echo &quot;版本号 = ${BUNDLE_SHORT_VERSION}&quot;
    # 取build值
    BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c &quot;print CFBundleVersion&quot; &quot;${PROJECT_INFOPLIST_PATH}&quot;)
    echo &quot;开发版本 = ${BUNDLE_VERSION}&quot;
    DATE=&quot;$(date +%Y%m%d)&quot;
    IPA_NAME=&quot;${APP_NAME}_V${BUNDLE_SHORT_VERSION}.${BUNDLE_VERSION}_${DATE}.ipa&quot;
    # ipa文件路径，保存起来以便后面使用
    IPA_PATH=&quot;$PWD/${IPA_NAME}&quot;
    echo &quot;要上传的ipa文件路径 = ${IPA_PATH}&quot;
    echo &quot;${IPA_PATH}&quot;&gt;&gt; ipa_path
    # 下面3行是集成有Cocopods的用法
    echo &quot;=============pod install===============&quot;
    pod install

    echo &quot;================clean==================&quot;
    xcodebuild \
        -workspace &quot;${APP_NAME}.xcworkspace&quot; \
        -scheme &quot;${APP_NAME}&quot;  \
        -configuration &#39;Release&#39; \
        clean

    echo &quot;===============archive=================&quot;
    xcodebuild \
        -workspace &quot;${APP_NAME}.xcworkspace&quot; \
        -scheme &quot;${APP_NAME}&quot; \
        -sdk iphoneos \
        -configuration &#39;Release&#39; \
        -archivePath &quot;${APP_NAME}.xcarchive&quot; \
        PROVISIONING_PROFILE_SPECIFIER=&quot;PROVISIONING_PROFILE_NAME_OR_ID&quot; \
        DEVELOPMENT_TEAM=&quot;TEAMID&quot; \
        -allowProvisioningUpdates \
        SYMROOT=&#39;$PWD&#39; \
        archive

    # 将app打包成ipa
    echo &quot;================export=================&quot;
    xcodebuild \
        -exportArchive \
        -archivePath &quot;${APP_NAME}.xcarchive&quot; \
        -exportOptionsPlist &quot;${EXPORT_PLIST}&quot; \
        -exportPath &quot;$PWD&quot;

    # 将ipa的名称修改成我们自定义的名称 IPA_NAME
    mv &quot;${APP_NAME}.ipa&quot; &quot;${IPA_NAME}&quot;
    
```


## 需要注意几点：

1.  archive 前 clean 是一个比较好的习惯，清除上次构建形成的中间文件。
2.  archive 时配置了`PROVISIONING_PROFILE_SPECIFIER`和`DEVELOPMENT_TEAM`，用于指定 archive 的签名使用的证书，需要使用 development 用的 Provisioning Profile ，不可以用 app store 或 ad-hoc 的。
3.  第 2 点中那两个配置，如果去掉，则默认读取 xcodeproj 中的配置。此时可以在 Xcode 的`Target-&gt;Signing-&gt;Automaticall manage signing`打勾由 Xcode 设置开发证书，或自己设置开发用的 Provisioning Profiles 并确保配置无误（ manual signing ）。
4.  还是第 2 点的配置，在命令中可以配置的命令请见[这里](https://help.apple.com/xcode/mac/current/#/itcaec37c2a6?sub=dev186481df2)。
5.  `allowProvisioningUpdates`是 Xcode9 才引入的，允许`xcodebuild`自动更新 Provisioning profile 等。

### [](#exportOptionsPlist-参数 "-exportOptionsPlist 参数")-exportOptionsPlist 参数

ExportOptions.plist 存在很久了，只是一直没有被拿来使用。在 xcodebuild 打包的时候，这个参数指定 ExportOptions.plist 的位置，用来告诉`xcodebuild`怎么将`.xcarchive`文件打包。

下面是笔者所使用的 plist 文件：

![](https://oaoa-1256157051.cos.ap-guangzhou.myqcloud.com/blog/gq8g9.png)

provisioningProfiles 中，key 是 bundleid ， value 是对应的 provisioningProfile 的名称或 ID 。

有哪些键可以通过`xcodebuild -help`，然后拉到最下面查看。

![](https://oaoa-1256157051.cos.ap-guangzhou.myqcloud.com/blog/l89oh.png)

如果还是觉得创建麻烦，可以先在 Xcode 中手动打包一遍，在 Export 后的文件夹中找到`ExportOptions.plist`，这就是适用于项目的 plist 文件了。

## [](#Troubleshotting "Troubleshotting")Troubleshotting

编写此章节，是为了记录打包时出现的错误，长期更新：

### [](#1-ipatool-json-filepath-XXXXXX-“No-value” "1.ipatool-json-filepath-XXXXXX “No value”.")1.ipatool-json-filepath-XXXXXX “No value”.

![](https://oaoa-1256157051.cos.ap-guangzhou.myqcloud.com/blog/m5j01.png)

笔者遇到此问题的时候，是因为 archive 失败，但是路径中还是出现了`.xcarchive`文件，继续往下 export 的时候就报错了，此时不妨尝试一下，只是 archive 是否有问题？具体原因笔者尚未发现。

## [](#Reference "Reference")Reference

[1.Building from the Command Line with Xcode FAQ](https://developer.apple.com/library/content/technotes/tn2339/_index.html)

[2.Using -exportArchive instead of Package Application to export an IPA](http://subathrathanabalan.com/2016/01/07/building-ipa-export-archive/)

[3.XCArchive to ipa](https://encyclopediaofdaniel.com/blog/xcarchive-to-ipa/)

[4.Xcode Help](https://help.apple.com/xcode/mac/current/#/dev3a05256b8)
 

* * *
 