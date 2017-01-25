--- 
title: "iOS 音频播放 —— AVAudioSession"
date: 2016-11-22 11:15:06  
tag: avaudiosession

--- 

# iOS 音频播放 —— AVAudioSession
 
 

> An audio session is a singleton object that you employ to set the audio context for your app and to express to the system your intentions for your app’s audio behavior.

上面是摘自[官方文档](https://developer.apple.com/library/prerelease/ios/documentation/AVFoundation/Reference/AVAudioSession_ClassReference/)的介绍。大体就是说明一下 `AVAudioSession` 是一个单例对象，并用来为音频类app向系统传递一些配置信息。 其实在iOS7以前甚至是现在为止还有相当一部人使用的是`AudioToolBox`框架下的`AudioSession`，不过`AudioSession`在SDK7中已经被苹果标明 _depracated_。所以我们主要就以`AVAudioSession`为主，与时俱进嘛！

`AVAudioSession` 的主要功能包括以下几点功能：

*   向系统说明你的app使用音频的模式（比如是播放还是录音，是否支持蓝牙播放，是否支持后台播放）
*   为你的app选择音频的输入输出设备（比如输入用的麦克风，输出是耳机、手机功放或者airplay）
*   协助管理多个音源需要播放时的行为（例如同时使用多个音乐播放app，或者突然有电话接入）

下面就开始 `AVAudioSession`相关功能的使用，大家可以用我们上一篇写好的 ——离线歌曲播放的例子来进行演练。

* * *

## 激活音频会话

细心的朋友可能已经发现我们上一篇写好的音频播放有很大的局限性，比如：不支持后台播放、当手机处于禁音状态时也无法正常输出声音。这个时候就需要我们去激活音频会话，也就是 `AVAudioSession` 。激活的方法非常简单大家可以在初始化播放器的时候加上下面一段代码

    //激活音频会话
    [[AVAudioSession sharedInstance]setCategory:AVAudioSessionCategoryPlayback withOptions:AVAudioSessionCategoryOptionAllowBluetooth error:nil];
    [[AVAudioSession sharedInstance]setActive:YES error:nil];

这段代码的意思呢就是设置我们app音频会话的`category`（模式）和`option`（选项），下面这张表就是几种可选的`category`及其效果，大家在实际开发中可以根据自己的实际情况去选择对应的参数：

<table>
<thead>
<tr>
<th>会话类型</th>
<th style="text-align:center">说明</th>
<th style="text-align:center">是否要求输入</th>
<th style="text-align:center">是否要求输出</th>
<th style="text-align:right">是否遵从静音键</th>
</tr>
</thead>
<tbody>
<tr>
<td>AVAudioSessionCategoryAmbient</td>
<td style="text-align:center">混音播放，可以与其他音频应用同时播放</td>
<td style="text-align:center">否</td>

<td style="text-align:center">是</td>

<td style="text-align:right">是</td>

</tr>

<tr>

<td>AVAudioSessionCategorySoloAmbient</td>

<td style="text-align:center">独占播放</td>

<td style="text-align:center">否</td>

<td style="text-align:center">是</td>

<td style="text-align:right">是</td>

</tr>

<tr>

<td>AVAudioSessionCategoryPlayback</td>

<td style="text-align:center">后台播放，独占</td>

<td style="text-align:center">否</td>

<td style="text-align:center">是</td>

<td style="text-align:right">否</td>

</tr>

<tr>

<td>AVAudioSessionCategoryRecord</td>

<td style="text-align:center">录音模式</td>

<td style="text-align:center">是</td>

<td style="text-align:center">否</td>

<td style="text-align:right">否</td>

</tr>

<tr>

<td>AVAudioSessionCategoryPlayAndRecord</td>

<td style="text-align:center">播放和录音，此时可以录音也可以播放</td>

<td style="text-align:center">是</td>

<td style="text-align:center">是</td>

<td style="text-align:right">否</td>

</tr>

<tr>

<td>AVAudioSessionCategoryAudioProcessing</td>

<td style="text-align:center">硬件解码音频，此时不能播放和录制</td>

<td style="text-align:center">否</td>

<td style="text-align:center">否</td>

<td style="text-align:right">否</td>

</tr>

<tr>

<td>AVAudioSessionCategoryMultiRoute</td>

<td style="text-align:center">多种输入输出，例如可以耳机、USB设备同时播放</td>

<td style="text-align:center">是</td>

<td style="text-align:center">是</td>

<td style="text-align:right">否</td>

</tr>

</tbody>

</table>

激活音频会话后，我们就可以开始执行一系列跟 `AVAudioSession` 的服务了。

* * *

## 后台播放及远程控制

可以这么说，不支持后台播放的音频类app是不完整的，但是要我们的app支持后台播放外，还需要给我们的项目设置一些参数。  
网上很多教程都是教的直接修改plist文件，我这里也放出来这种方法：在info.plist 文件中加入如下参数_Required background modes_并在_item 0_中写入App plays audio or streams audio/video using AirPlay。如下图

<div class="image-package">![](http://upload-images.jianshu.io/upload_images/1182541-ec11b72f651cf960.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)  

<div class="image-caption">在plist中注册后台播放</div>

</div>

但是Xcode其实在很早的版本就已经提供了图形化的操作界面，更为的直观，不知大家是没有发现还是什么原因，相关的一些配置都是直接修改的plist，下面就是图形化的设置方法。如图

<div class="image-package">![](http://upload-images.jianshu.io/upload_images/1182541-9fa38bc4562fc328.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)  

<div class="image-caption">图形化操作界面注册后台播放</div>

</div>

好了，这个时候重新运行我们的程序home到后台后，我们的播放器就不会暂停播放了。不过这个时候我们呼出系统的控制台发现我们播放的歌曲并没有在这显示，这是因为我们呢没有告诉系统我们的app接受远程控制，下面让我们的播放器响应远程。

首先要在初始化播放器的时候或者是_appDelegate_的`- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;`这个方法中加入这段代码

    //告诉系统，我们要接受远程控制事件
    [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];
    [self becomeFirstResponder];

如果你的app是以音频播放为主，我建议你的代码是写在_appDelegate_中。重写_appDelegate_的`canBecomeFirstResponder`方法让我们的_appDelegate_可以成为第一响应者，已响应控制台的操作。

    - (BOOL)canBecomeFirstResponder{
        return YES;
    }

最后只要再实现一下`- (void)remoteControlReceivedWithEvent:(UIEvent *)receivedEvent;`这个方法，我们app的远程控制功能就完成了。

    //响应远程音乐播放控制消息
    - (void)remoteControlReceivedWithEvent:(UIEvent *)receivedEvent {
        if (receivedEvent.type == UIEventTypeRemoteControl) {
            switch (receivedEvent.subtype) {
                case UIEventSubtypeRemoteControlPlay:
                    [self.playCenter midBtnClicked:nil];
                    NSLog(@"暂停播放");
                    break;
                case UIEventSubtypeRemoteControlPause:
                    [self.playCenter midBtnClicked:nil];
                    NSLog(@"继续播放");
                    break;
                case UIEventSubtypeRemoteControlNextTrack:
                    NSLog(@"下一曲");
                    break;
                case UIEventSubtypeRemoteControlPreviousTrack:
                    NSLog(@"上一曲");
                    break;
                default:
                    break;
            }
        }
    }

这里我只是简单的举例了其中几个常用的枚举值，更详细远程控制会在后续完善。

差点忘记，在控制台中也是可以看到正在播放的歌曲的哦，不过如果你没有配置的话，那就只会显示你app的名字了，代码如下

    [[MPNowPlayingInfoCenter defaultCenter] setNowPlayingInfo:@{MPMediaItemPropertyTitle:self.detailModel.sampleAudioTitle,MPMediaItemPropertyAlbumTitle:self.detailModel.sampleAuther}];

* * *

### 监听RouteChange事件

监听_RouteChange_事件，我们一般是为了实现 _拔出耳机后暂停播放_ 这个功能。

    //首先向NSNotificationCenter添加通知
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(routeChange:) name:AVAudioSessionRouteChangeNotification object:nil];

`-(void)routeChange:(NSNotification *)notification`实现如下：

    /**
     *  一旦输出改变则执行此方法
     *
     *  @param notification 输出改变通知对象
     */
    -(void)routeChange:(NSNotification *)notification{
        NSDictionary *dic=notification.userInfo;
        int changeReason= [dic[AVAudioSessionRouteChangeReasonKey] intValue];
        //等于AVAudioSessionRouteChangeReasonOldDeviceUnavailable表示旧输出不可用
        if (changeReason==AVAudioSessionRouteChangeReasonOldDeviceUnavailable) {
            AVAudioSessionRouteDescription *routeDescription=dic[AVAudioSessionRouteChangePreviousRouteKey];
            AVAudioSessionPortDescription *portDescription= [routeDescription.outputs firstObject];
            //原设备为耳机则暂停
            if ([portDescription.portType isEqualToString:@"Headphones"]) {
               if (self.playButton.selected) {
                  [self playButtonAction:_playButton];
               }
            }
        }
    }

一般来说如果没有实现 _拔出耳机后暂停播放_ ，系统会自动的把默认输出设备设置为扬声器。但是有一个例外，就是当`AVAudioSession` 的 `Category` 设置为 `AVAudioSessionCategoryPlayAndRecord` 的时候，音频输出的默认设备是听筒而不是扬声器。这个时候如果你既不希望播放器自动暂停播放，又希望切换到扬声器播放的时候，你可能需要做如下处理，一样是在方法 `-(void)routeChange:(NSNotification *)notification;` 中实现

    NSError *error = nil;
    AVAudioSession *session = [AVAudioSession sharedInstance];   
    //强制设置为扬声器播放
    [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error];
 
