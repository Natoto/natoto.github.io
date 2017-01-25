---
layout: post
title: 【React Native】React Native 移植原生iOS平台
tag: React Native
date: 2015-11-15 
---

#【React Native】React Native 移植原生iOS平台

主要命令：
```
  (JS_DIR=`pwd`/ReactComponent; cd Pods/React/packager;  node packager.js  --root $JS_DIR)
```
##(一)前言

今天我们来看一下React Native移植到iOS原生应用,通过本节讲解,相信大家对于正在开发的iOS原生项目就可以移植到React Native平台中来,或者采取原生加RN混合开发模式啦。


##(二)准备工作

1.安装CocoaPods     -这个相应大家如果之前做过iOS开发应该都清除的吧。安装命令:gem install  cocoapods  注意如果出现安装权限问题,可以运行sudo gem install cocoapods命令

2.Node.js    -如果大家已经在Mac平台已经成功运行过React Native应用，那么该肯定是安装了(没安装,点击进入了解)。安装nvm的教程点击命令，该命令会进行安装最新的Node.js版本，然后配置好环境变量。最后你可以通过命令node来启动运行Node.js环境。大家可能也知道，通过nvm，大家可以安装多个Node.js版本并且很方便的进行切换选择。

3.间接着,你可以命令切换到你的项目的根目录，命令运行npm install react-native来进行安装react-native包依赖。

以上步骤完成之后，在你项目根目录上面会存在一个React Native包，该命名为node_modules，和.xcodeproj文件平级。

##(三)使用CocoaPods进行安装React Native库

CocoaPods是iOS/Mac开发中的包管理器，我们需要使用CocoaPods来进行下载React Native。如果你到现在还没有安装CocoaPods，那么请点击了解安装向导  ，至于具体怎么样安装相信大家看官方向导或者百度一下，就会了。

当你用CocoaPods进行工作的时候，需要往Podfile文件中添加如下的一些代码信息。如果你还没有该文件，可以在项目的根目录上面进行创建一下。具体需要添加的信息如下:
```

# Depending on how your project is organized, your node_modules directory may be
# somewhere else; tell CocoaPods where you've installed react-native from npm
pod 'React', :path => './node_modules/react-native', :subspecs => [
  'Core',
  'RCTImage',
  'RCTNetwork',
  'RCTText',
  'RCTWebSocket',
  # Add any other subspecs you want to use in your project
]
```
记住需要添加安装所有的组件模块依赖才可以，例如如果你需要使用<Text>元素，但是如果没有安装RCTText，那么不行啦。

然后运行命令进行安装: pod install

##(四)创建React Native应用

下面你两个注意步骤:

1.应用的入口/根JavaScript文件必须包含你的实际React Native应用和其他组件

2.封装Objective-C代码，加载你的脚本代码和创建一个RCTRootView对象来显示和管理你的React Native组件。

现在我们开始创建啦：

首先创建一个文件夹来存放应用的React代码，然后新建一个简单的index.ios.js文件，具体命令如下:
```
$ mkdir ReactComponent
$ touch ReactComponent/index.ios.js
```
复制和粘贴如下的代码到index.ios.js文件中，这是一个最简单的React Native应用啦;
```
'use strict';


import React, {
  Text,
  View
} from 'react-native';


conststyles = React.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red'
  }
});


class SimpleApp extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>This is a simple application.</Text>
      </View>
    )
  }
}


React.AppRegistry.registerComponent('SimpleApp', () => SimpleApp);
```
上面代码中的SimpeApp就是你的模块名称，该名称请记住，后边需要用到的哦~

(五)往应用中添加容器视图

现在你需要一个容器视图来转载React Native组件，该可以为你应用中任何的UIView。

当然了，为了我们的代码更加整洁干净,我们创建一个继承UIView的ReactView。你点击YourProject.xcworkspace(具体你本地的项目)，然后创建一个新的类ReactView(当然你可以随你自己喜欢进行命名…)

```
// ReactView.h


#import <UIKit/UIKit.h>
@interface ReactView : UIView
@end
```
然后在需要管理这个视图的ViewController中，添加关联。
 
```
// ViewController.m

@interface ViewController ()
@property (weak, nonatomic) IBOutlet ReactView *reactView;
@end
```
[注意].如果你的是Swift应用，就不需要这一步。同时这边我为了简化的演示相关效果，已经禁用了AutoLayout了，但是在实际的开发中，那么就需要打开AutoLayout并且设置相关约束。

(六)往容器视图中添加RCTRootView

前面我们已经做了好多准备工作了，那么现在重点来了，最后在确定一遍，你准备好了没？现在我们需要来创建RCTRootView来引入React Native应用了。

在ReactView.m文件中，我们首先需要加载index.ios.bundle文件来初始化RCTRootView, index.ios.bundle文件会由React Native Server进行创建并且可以通过React Native服务访问到。这个我们之后的教程会讲解到啦。
```
NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios"];
// For production use, this `NSURL` could instead point to a pre-bundled file on disk:
//
//  NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
//
// To generate that file, run the curl command and add the output to your main Xcode build target:
//
//  curl http://localhost:8081/index.ios.bundle -o main.jsbundle
RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                    moduleName: @"SimpleApp"
                                            initialProperties:nil
                                                launchOptions:nil];
```
然后把它添加成ReactView的子视图

```
[self addSubview:rootView];
rootView.frame = self.bounds;
```
(七)Swift应用

如果你的是Swift应用的话，那么需要你在ReactView.swift文件中添加如下代码:
 ```
import UIKit
import React


class ReactView: UIView {


  let rootView: RCTRootView = RCTRootView(bundleURL: NSURL(string: "http://localhost:8081/index.ios.bundle?platform=ios"),
    moduleName: "SimpleApp", initialProperties: nil, launchOptions: nil)


  override func layoutSubviews() {
    super.layoutSubviews()


    loadReact()
  }


  func loadReact () {
        addSubview(rootView)
        rootView.frame = self.bounds
  }
}
```
最后你需要确定一下你的该视图有没有添加到视图容器中或者故事板文件中(StoryBoard)

(八)启动开发服务器

在项目根目录中，我们需要开启React Native开发服务器，具体命令如下:(一般教程用)
 
(JS_DIR=`pwd`/ReactComponent;cd node_modules/react-native; npm run start -- --root $JS_DIR)

注意：上面的命令可能不生效用这个命令👇
```
(JS_DIR=`pwd`/ReactComponent; cd Pods/React/packager;  node packager.js  --root $JS_DIR)
```
以上的命令，可以开启React Native开发服务，来构建我们的bundle文件。--root选项用来标注React Native应用所在的根目录。我们当前的例子是ReactComponents目录，在该文件夹中有一个index.ios.js文件。服务器启动之后会进行打包出来index.ios.bundle文件，然后让我们可以通过http://localhost:8081/index.ios.bundle进行访问。

(九)更新App Transport Security

在iOS9.0开始或者更高版本的系统中，除非特别配置，否则我们的应用是不能通过http访问localhost主机服务器的。具体解决方案可以查看:http://stackoverflow.com/questions/31254725/transport-security-has-blocked-a-cleartext-http

解决方案:推荐大家在应用的Info.plist文件作如下修改，把localhost本机访问排查例外项。
><key>NSAppTransportSecurity</key><dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict> <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>   <true/>
        </dict>
    </dict>
</dict>

如果大家没有这样做，那么可能会遇到Could not connect to development server的错误哦

##(十)编译和运行

现在开始编译和运行你的应用，你会发现你的React Native应用运行在ReactView视图容器中了，具体截图如下

注意在模拟器调试中我们可以实现热加载的(只要修改了JS代码，模拟器页面自动刷新的效果，确保在Build Settings->Preprocessor Macros中设置DEBUG=1)