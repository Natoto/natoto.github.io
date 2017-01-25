---
layout: post
title: 【React Native 真机打包
tags: React Native
date: 2016-11-15
---

##React Native 真机打包
> 离线包不适合真机调试
> android 打包
> ios 打包


### Android 打包步骤 
打包步骤
1.在工程根目录下执行打包命令，比如
```
react-native bundle --entry-file index.android.js --bundle-output ./android/app/src/main/assets/index.android.jsbundle --platform android --assets-dest ./android/app/src/main/res/ --dev false
```
**注意:[./android/app/src/main/assets/]文件夹存在**。
2.增量升级的话不要把图片资源直接打包到res中，脚本如下：
```
react-native bundle --entry-file index.android.js --bundle-output ./bundle/androidBundle/index.android.jsbundle --platform android --assets-dest ./bundle/androidBundle/ --dev false
```
3.保证MainActivity.java中的setBundleAssetName与你的jsbundle文件名一致，比如.setBundleAssetName("index.android.jsbundle")就与我生成的资源名一致
 

### ios打包

1.使用终端在工程根目录下执行打包命令
``` 
react-native bundle --entry-file index.ios.js --bundle-output ./bundle/iosBundle/index.ios.jsbundle –platform ios –assets-dest ./bundle/iosBundle –dev false
```
**注意要先保证bundle文件夹存在。**

或者通过下载的方式得到main.jsbundle
 ```
curl http://localhost:8081/index.ios.bundle -o  ./main.jsbundle
```
2.在xcode中添加assets【必须用Create folder references的方式，添加完是蓝色文件夹图标】和index.ios.jsbundle
3.参考官方文档，修改RN页面入口代码

``` object-c
  NSURL *jsCodeLocation;

  jsCodeLocation =
#if (TARGET_IPHONE_SIMULATOR)
  // 在模拟器的情况下
  [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
#else
  [[NSBundle mainBundle] URLForResource:@"index.ios" withExtension:@"jsbundle" subdirectory:@"iosBundle"];
  // 在真机情况下
#endif  
```
步骤示例👇

![添加iosbundle.png](http://upload-images.jianshu.io/upload_images/1091358-af7bec1b8ff65a1e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



![填充iosBundle成功.png](http://upload-images.jianshu.io/upload_images/1091358-cfa1b1d7807fa4b9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### ios真机调试

在开发的阶段，我们可以使用本地服务器作为模拟服务器，这样在开发过程中，方便开发者测试开发。
按照以下步骤操作：
*  真机设备与电脑设备必须在同一个WiFi站点上，因为这样真机设备才能访问得到本地电脑上安装的模拟服务器。
*  打开React Native项目中的ios项目中的AppDlegate.m文件，更具下图所示修改：
 ![这里写图片描述](http://upload-images.jianshu.io/upload_images/1091358-75315ab50dd7b939?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
将上图中的192.168.1.103 改为你的电脑的IP地址。 
* 然后用USB数据线连接电脑和真机设备，点开XCode，选择真机设备。 
* 点击Run 或者 command + R 运行程序。 
* 摇晃手机可以打开开发者菜单，菜单中可以选择调试选项。

ios打包遇到的问题
>离线包如果开启了chrome调试，会访问调试服务器，而且会一直loading出不来。
如果bundle的名字是main.jsbundle,app会一直读取旧的,改名就好了。。。非常奇葩的问题，我重新删了app，clean工程都没用，就是不能用main.jsbundle这个名字。
必须用Create folder references【蓝色文件夹图标】的方式引入图片的assets，否则引用不到图片
执行bundle命令之前，要保证相关的文件夹都存在