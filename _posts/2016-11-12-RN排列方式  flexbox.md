---
layout: post
title: RN排列方式  flexbox
tag: React Native 
date: 2016-11-12 
---

#RN排列方式  flexbox 

这两天看了一下react native 果然是布局很高效，最重要的知识点都在下面的笔记里面了
知识点链接 http://reactnative.cn/docs/0.31/layout-with-flexbox.html#content
------------------- 
flex:根据屏幕调控比例 弹性（Flex）宽高

flexDirection： 布局方向垂直或者水平
(row,column)

justifyContent 子元素沿着主轴的排列方式 子元素是应该靠近主轴的起始端还是末尾段分布呢？亦或应该均匀分布？
flex-start、center、flex-end、space-around以及space-between

与alignItems 控制次轴排列方式共用可以摆布元素排列的水平，居上左，下右，上右，下左

align中文意思排列，分垂直排列和水平排列

alignItems 排列内部view(item)使用的一种布局方式，如果子项没有设置布局方式，就用父类的方式，种类有下面四个
enum('flex-start', 'flex-end', 'center', 'stretch') 

alignSelf  排列自身的方式，不能对子项目做控制
 enum('auto', 'flex-start', 'flex-end', 'center', 'stretch') 

flexDirection enum('row', 'row-reverse', 'column', 'column-reverse') 

flex-wrap 弹性盒子 值可以有(wrap,nowrap)
让弹性盒元素在必要的时候拆行：
http://www.runoob.com/try/try.php?filename=trycss3_flex-wrap


margin 表示内页边距，向内缩
marginLeft, 距左
marginRight, 距右
marginTop,距上
marginBottom, 距下
marginVertical,距上下
marginHorizontal,距左右

padding 表示对外填充(扩张) 向外扩张，包含方向的
paddingLeft,paddingRight,paddingTop,paddingBottom,paddingHorizontal,paddingVertical,

minHeight 最少高度
maxHeight最大高度
minWidth 最小宽度
maxWidth最大高度


下面是例子 可以直接放到rn里面运行
---------------
```
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

class RNCSDemo extends Component {
  render() {
    return (
      
      <View style={styles.style_0}> 
               <View style={[styles.view,styles.alignItems,{marginTop:30,marginLeft:20,backgroundColor:'brown'}]}>
                    <Text style={{height:30},styles.right}>居右摆设</Text>
               </View>   

                <View style={[styles.view,{alignItems:'center',justifyContent:'center', marginTop:10,backgroundColor:'green'}]}>
                    <Text style={{height:50,textAlign:'center'}}>居中摆放 使用 alignItems:'center',justifyContent:'space-around'</Text>
               </View>  

                <View style={[styles.view,{
                	marginTop:10,
                	backgroundColor:'green',
                	flexDirection:'row',
                	justifyContent: 'flex-end'}]}> 
                     <View style={{flex:1, backgroundColor:'yellow',margin:10}}>       
                      <Text style={{height:30},styles.center}>marginin 摆放</Text>              
               		</View>
               		 <View style={{flex:1,backgroundColor:'gray',paddingTop:50}}>
               		  <Text style={[{height:30,backgroundColor:'orange'},styles.center]}>PADDING 摆放</Text>               
               		</View>
                </View>  

                 <View style={[styles.view,{
                	marginTop:10,
                	backgroundColor:'green',
                	flexDirection:'column',
                	//alignItems:'flex-start',//这是次轴排列方式，
                	justifyContent: 'flex-start',//这是主轴排列方式，如果布局主轴方向是纵向，则表示纵向的排列排列方式，则alignItems表示次轴的排列方向
                }]}> 

                     <View style={{flex:1,backgroundColor:'yellow',alignItems:'center',justifyContent:'center'}}>       
                      <Text style={[{backgroundColor:'red'}]}>主轴次轴的排列  A</Text>              
               		</View>
  
                     <View style={{flex:1,backgroundColor:'gray'}}>
             		  <Text style={[{height:40},styles.center]}>主轴次轴的排列  B</Text>               
               		</View>

                </View>  
       </View> 
    );
  }
}

const styles = StyleSheet.create({

   alignItems:{
    	alignItems:'flex-end',
   },

  view:{   
  	  marginLeft:10,
  	  marginRight:10,
      borderWidth: 1,
      marginBottom:10,  
      flex:1,
      borderColor: 'blue',
      //alignItems:'stretch',//调整内部view的对齐方式 ('flex-start', 'flex-end', 'center', 'stretch')
  },
  container: {
    flex: 1,  //弹性高度比例
    justifyContent: 'center',// 可以决定其子元素沿着主轴的排列方式。子元素是应该靠近主轴的起始端还是末尾段分布呢？
    //亦或应该均匀分布？对应的这些可选项有：flex-start、center、flex-end、space-around以及space-between。
    alignItems: 'center',  //子布局
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  style_0:{
     flex:1,  
     flexDirection: 'column'
  },
  style_1:{ 
      flex: 5,
      flexDirection: 'row',
      height:40,
      borderWidth: 1,  
      borderColor: 'red',
  },

  // alignSelf的对齐方式主要有四种：flex-start、 flex-end、 center、  auto、 stretch
  center:{
    alignSelf:'center'
  },

  left:{
    alignSelf:'flex-start'
  },

  right:{
    alignSelf:'flex-end'
  }

});

AppRegistry.registerComponent('RNCSDemo', () => RNCSDemo);

```
效果图
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/1091358-d223993113edada7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


附所有的style

```js
  
所有的styles 
"alignItems",
"alignSelf",
"backfaceVisibility",
"backgroundColor",
"borderBottomColor",
"borderBottomLeftRadius",
"borderBottomRightRadius",
"borderBottomWidth",
"borderColor",
"borderLeftColor",
"borderLeftWidth",
"borderRadius",
"borderRightColor",
"borderRightWidth",
"borderStyle",
"borderTopColor",
"borderTopLeftRadius",
"borderTopRightRadius",
"borderTopWidth",
"borderWidth",
"bottom",
"color",
"flex",
"flexDirection",
"flexWrap",
"fontFamily",
"fontSize",
"fontStyle",
"fontWeight",
"height",
"justifyContent",
"left",
"letterSpacing",
"lineHeight",
"margin",
"marginBottom",
"marginHorizontal",
"marginLeft",
"marginRight",
"marginTop",
"marginVertical",
"opacity",
"overflow",
"padding",
"paddingBottom",
"paddingHorizontal",
"paddingLeft",
"paddingRight",
"paddingTop",
"paddingVertical",
"position",
"resizeMode",
"right",
"rotation",
"scaleX",
"scaleY",
"shadowColor",
"shadowOffset",
"shadowOpacity",
"shadowRadius",
"textAlign",
"textDecorationColor",
"textDecorationLine",
"textDecorationStyle",
"tintColor",
"top",
"transform",
"transformMatrix",
"translateX",
"translateY",
"width",
"writingDirection"
```