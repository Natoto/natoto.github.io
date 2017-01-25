---
layout: post
title:iOS animation动画三个角色(下)
tags: Animation
date: 2016-03-04
---
 

------
上篇iOS animation动画三个角色(上)介绍了主角CALayer和几个动画剧本。本篇以几个小例子配以武功秘籍继续介绍其他主角

* 形状图层  CAShapeLayer  绘制不规则图形(太极拳)
* 渐变图层 CAGradientLayer 颜色渐变、阴影(隐身术)
* 复制图层 CAReplicatorLayer 迭代复制同一个图层(分身术)

---
#### CAShapeLayer 太极圈
继承自CALayer，因此，可使用CALayer的所有属性。但是，CAShapeLayer需要和贝塞尔曲线配合使用才有意义。

关于UIBezierPath
>path:表示路径，可以用贝塞尔曲线，也可以自定义路径
>fillcolor:表示填充色
>strokeColor：线条颜色
>linewidth：线的宽度
>strokeStart：stroke的起始点(0~1)
>strokeEnd:stroke的结束点(0~1)
实例

```
@interface ProgressView : UIView
@end
@implementation ProgressView
-(id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        CAShapeLayer * shapelayer = [CAShapeLayer layer];
    
        UIBezierPath * path = [UIBezierPath bezierPathWithArcCenter:CGPointMake(frame.size.width/2, frame.size.height/2) radius:frame.size.width/2 startAngle:0 endAngle:2*M_PI clockwise:YES];
        //[UIBezierPath bezierPathWithRoundedRect:frame cornerRadius:frame.size.width/2];
        //路径
        shapelayer.path = path.CGPath;
        //填充色
        shapelayer.fillColor = [UIColor clearColor].CGColor;
        // 设置线的颜色
        shapelayer.strokeColor = [UIColor orangeColor].CGColor;
        //线的宽度
        shapelayer.lineWidth = 5;
        [self.layer addSublayer:shapelayer];
        
        //设置stroke起始点
//        shapelayer.strokeStart = 0;
//        shapelayer.strokeEnd = 0.75;
        
        CABasicAnimation * anima = [CABasicAnimation animationWithKeyPath:@"strokeEnd"];
        anima.fromValue = [NSNumber numberWithFloat:0.f];
        anima.toValue = [NSNumber numberWithFloat:1.f];
        anima.duration = 4.0f;
        anima.repeatCount = MAXFLOAT;
        anima.timingFunction = UIViewAnimationOptionCurveEaseInOut;
        [shapelayer addAnimation:anima forKey:@"strokeEndAniamtion"];
 
        
        CABasicAnimation *anima3 = [CABasicAnimation animationWithKeyPath:@"transform.rotation.z"];
        anima3.toValue = [NSNumber numberWithFloat:-M_PI*2];
        anima3.duration = 2.0f;
        anima3.repeatCount = MAXFLOAT;
        anima3.timingFunction = UIViewAnimationOptionCurveEaseInOut;
        [self.layer addAnimation:anima3 forKey:@"rotaionAniamtion"];
    }
    return self;
}
@end
```
演示图
![shapeloading](https://raw.githubusercontent.com/Natoto/AnimationDemo/master/screenshot/shapeloading.gif) 

#### CAGradientLayer 隐身术，渐变术
继承calayer，主要用于处理颜色渐变的图层。主要有以下的Properties
>@property(copy) NSArray *colors
渐变颜色的数组
>注意这几个数字在0到1之间单调递增。
@property CGPoint startPoint
映射locations中第一个位置，用单位向量表示，比如（0，0）表示从左上角开始变化。默认值是(0.5,0.0)。
@property CGPoint endPoint
映射locations中最后一个位置，用单位向量表示，比如（1，1）表示到右下角变化结束。默认值是(0.5,1.0)。
@property(copy) NSString *type
默认值是kCAGradientLayerAxial，表示按像素均匀变化。除了默认值也无其它选项。

```
//做颜色渐变
-(void)testslidetounlock
{
    UILabel * textLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 100, 200, 30)];
    textLabel.center = self.view.center;
    textLabel.textColor = [UIColor colorWithWhite:1 alpha:0.8];
    textLabel.textAlignment = NSTextAlignmentCenter;
    textLabel.text = @">> 滑动来解锁 >>>";
    [self.view addSubview:textLabel];

    CAGradientLayer *gradient = [CAGradientLayer layer];
//    gradient.backgroundColor = [UIColor grayColor].CGColor;
    gradient.frame = textLabel.bounds;
    UIColor *startColor = [UIColor whiteColor];
    UIColor *endColor   = [UIColor clearColor];
    gradient.colors = @[(id)endColor.CGColor,(id)startColor.CGColor, (id)endColor.CGColor];
    gradient.startPoint = CGPointMake(0, 0);//(左，下)
    gradient.endPoint = CGPointMake(1, 0);//(右，下)
//    [textLabel.layer insertSublayer:gradient atIndex:0];
    gradient.locations = @[@.2,@.5,@.8];
    
    textLabel.layer.mask = gradient;
    CABasicAnimation * gradientanimation = [CABasicAnimation animationWithKeyPath:@"locations"];
    gradientanimation.fromValue = @[@0, @0,@0.25];
    gradientanimation.toValue = @[@0.75,@1 ,@1];
    gradientanimation.duration = 2.5;
    gradientanimation.repeatCount = HUGE;
    [gradient addAnimation:gradientanimation forKey:@"gradientanimation"];//gradient, forKey: nil)
}
``` 
演示图
![滑动开锁动画](https://raw.githubusercontent.com/Natoto/AnimationDemo/master/screenshot/gradientlayer.gif)

### CAReplicatorLayer 分身术
复制器图层(观音送给孙悟空的三根毫毛，吹一下就变成无数的猴子猴孙)
CAReplicatorLayer是一个容器层
 复制自己子层的layer,并且复制的出来的layer和原来的子layer拥有相同的动效。然后通过设置一些属性，可以设置其偏移位置让其依次排列，也可以设置不同的触发时间这样就形成了动画的效果
常用于做loading动画

![repicator例子](https://raw.githubusercontent.com/Natoto/AnimationDemo/master/screenshot/repeatloading.gif)

此处包含两个动画，一个是正在播放的状态动画，一个是加载的动画
#### 播放状态动画
```
@interface PlayingAnimationView : UIView
@end

@implementation PlayingAnimationView

-(id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        CAReplicatorLayer * replicatorLayer = [CAReplicatorLayer new];
        replicatorLayer.bounds = CGRectMake(0, 0, frame.size.width, frame.size.height); 
        replicatorLayer.anchorPoint = CGPointMake(0, 0);
        [self.layer addSublayer:replicatorLayer];
        
        CALayer * rectangle = [CALayer new];
        CGFloat width = (frame.size.width - 30)/4;
        rectangle.bounds = CGRectMake(0, 0, width, frame.size.height - 10);//: 0, y: 0, width: 30, height: 90)
        rectangle.anchorPoint = CGPointMake(0, 0);
        rectangle.position = CGPointMake(frame.origin.x + 10, frame.origin.y + 110);
        rectangle.cornerRadius = 2;
        rectangle.backgroundColor = [UIColor whiteColor].CGColor;
        [replicatorLayer addSublayer:rectangle];
    
        
        CABasicAnimation * moveRectangle = [CABasicAnimation animationWithKeyPath:@"position.y"];
        moveRectangle.toValue = @(rectangle.position.y - 70);
        moveRectangle.duration = 0.7;
        moveRectangle.autoreverses = true;
        moveRectangle.repeatCount = HUGE;
        
        [rectangle addAnimation:moveRectangle forKey:nil];
        
        //复制动画和状态
        //重复次数
        replicatorLayer.instanceCount = 4;
        //平移点的间隔 x y z
        replicatorLayer.instanceTransform = CATransform3DMakeTranslation(width + 10, 0, 0);
        replicatorLayer.masksToBounds = true;
        replicatorLayer.instanceDelay =0.3;//延迟动画开始时间 以造成上下移动的效果 
    }
    return self;
}
@end
```
我们观察到主要CAReplicatorLayer可以对它自己的子Layer进行复制操作。创建了CAReplicatorLayer实例后，设置了它的尺寸大小、位置、锚点位置、背景色，并且将它添加到了replicatorAnimationView的Layer中。 
CAReplicatorLayer.h 
中文翻译如下：
> 复制器层创建的副本指定数量的其子层，每个副本都可能有几何，时间和适用于它的颜色变换。

|名称|功能|
|--|--|
|instanceCount|要创建的副本个数(默认一个)|
|preservesDepth|是否将3D例子系统平面化到一个图层(默认NO)|
|instanceDelay| 动画时间延迟。默认为0|
|instanceTransform|迭代图层的位置 CATransform3D对象(创建方法用:CATransform3DMakeRotation圆形排列，CATransform3DMakeTranslation水平排列)|
|instanceColor|颜色组件添加到实例k - 1产生的颜色实例的调制颜色k。清晰的颜色(默认不透明白色)|
|instanceRedOffset，instanceGreenOffset，instanceBlueOffset，instanceAlphaOffset | 加到实例K-1的颜色的颜色分量，以产生实例k的调制颜色。默认为鲜明的色彩（无变化）。|

#### 等待加载动画
```
@interface LoadingView : UIView
@end
@implementation LoadingView
-(id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        CAReplicatorLayer * replicatorLayer = [CAReplicatorLayer new];
        replicatorLayer.bounds = CGRectMake(0, 0, frame.size.width, frame.size.height);
        replicatorLayer.position = CGPointMake(frame.size.width/2, frame.size.height/2);
        [self.layer addSublayer:replicatorLayer];
        CALayer * circle = [CALayer new];
        circle.bounds = CGRectMake(0, 0, 15, 15);
        circle.position = CGPointMake(frame.size.width/2, frame.size.height/2 - 55);
        circle.cornerRadius = 7.5;
        circle.backgroundColor = [UIColor whiteColor].CGColor;
        [replicatorLayer addSublayer:circle];
        //复制15个同样的layer
        replicatorLayer.instanceCount = 15;
        CGFloat angle = 2 * M_PI/ 15.;
        replicatorLayer.instanceTransform = CATransform3DMakeRotation(angle, 0, 0, 1);
        replicatorLayer.instanceDelay = 1./15.;//延迟动画开始时间 以造成旋转的效果
     
        CABasicAnimation *scale = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
        scale.fromValue = @1;
        scale.toValue = @0.1;
        scale.duration = 1;
        scale.repeatCount = HUGE;
        circle.transform = CATransform3DMakeScale(0.01, 0.01, 0.01);
        [circle addAnimation:scale forKey:nil];
    }
    return self;
}
@end
```

总结：结合上篇文章体会一下，一些原来看起来很复杂的动画其实挺简单的。主要是要分解出最原始的状态，如果有重复就像孙悟空一样拔一根毫毛变出很多的猴子猴孙出来，一个大片用了这些主角，有了剧本，作为程序猿的你这个导演可以开拍大片了。

- 原创地址 http://www.jianshu.com/p/5d50bbc6b1de
- iOS animation动画的三个角色(上)http://www.jianshu.com/p/88ab3415a3fe
- 如果有兴趣欢迎下载[DEMO](https://github.com/Natoto/AnimationDemo)
- 喜欢就点个赞呗！