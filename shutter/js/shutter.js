/**
 * @file 纯js的百叶窗效果实现
 * @author：张少龙（zhangshaolong@baidu.com）
 */
/***
调用方法
new Shutter(
        {   
            imgsDiv:document.getElementById('imgsDiv'),（必需）
            smoothness:100,//切割光滑度，越大越细腻（可选）
            gridNumber:120,//最多图片切割个数（可选）
            imgInterval:2000,//背景图片轮换间隔（可选）
            slideInterval:10,//每切割一次的时间（可选）
            stylesFlg:false,//和styles配合使用，true 删除默认展示风格，使用自己定义的styles风格，false 在默认展示风格基础上增加自己定义的styles个性风格（可选）
            styles:[[4,1,2]],//个性风格属性（可选）
            stylesRandom:false//随即组合样式，设置为true时，所有默认和自定义的样式将无效（可选）
        });

***/
(function (root, factory) {
    var shutter = factory();
    if (typeof define === 'function') {
        define(function() {
            return shutter;
        });
    } else {
        root.Shutter = shutter;
    }
})(this, function () {
    var slice = Array.prototype.slice;
    //上右下左
    var kinds = [
         [1, 1, 1, 1],//从中间往四周          0
         [1, -1, 1, -1],//从中间往上下        1
         [-1, 1, -1, 1],//从中间往两边        2
         [-1, -1, 1, -1],//从上到下           3
         [-1, 1, -1, -1],//从左到右           4
         [1, -1, -1, -1],//从下到上           5
         [-1, -1, -1, 1],//从右到左           6
         [-1, 1, 1, -1],//从左上角            7
         [1, -1, -1, 1],//从右下角            8
         [1, 1, -1, -1],//从左下角            9
         [-1, -1, 1, 1],//从右上角            10
         [1, 1, -1, 1],//从底部中间往上和两边 11
         [-1, 1, 1, 1],//从上部中间往下和两边 12
         [1, 1, 1, -1],//从左部中间往上下和右 13
         [1, -1, 1, 1],//从右部中间往上下和左 14
     ];
    var moveClip = function (o, arr) {
        o.style.clip = 'rect(' + arr.join(' ') + ')';
    };
    var createContainer = function (o){
        var containers = [],chips = [];
        var container = document.createElement('div');
        container.className = "outer-container";
        container.style.height = o.height + "px";
        container.style.width = o.width + "px";
        o.container = container;
        o.holder.appendChild(container);
        var pageBar = document.createElement('div');
        pageBar.className = 'pageBar';
        container.appendChild(pageBar);
        for(var i = 0; i < o.gridNumber; i++){
            var chipContainer = document.createElement('div');
            chipContainer.className = "chip-container";
            chips.push(chipContainer.appendChild(document.createElement('div')));
            containers.push(o.container.appendChild(chipContainer));
            chipContainer = null;
        };
        o.chips = chips;
        o.chipContainers = containers;
        for(var i = 0, l = o.imgs.length; i < l; i++){
            var pageLink;
            pageLink = document.createElement('a');
            pageLink.href = "javascript:void(0)";
            pageLink.innerHTML = (i + 1);
            o.links.push(pageBar.appendChild(pageLink));
            pageLink.numIndex = i;
            pageLink.onclick = function (){
                o.idx = this.numIndex;
                clearTimeout(o.changeImgTimer);
                clearInterval(o.slideTimer);
                o.play();
            };
            pageLink = null;
        };
    };
    var addContainer = function (o, url, col, row) {
        var w = Math.ceil(o.width / col),h = Math.ceil(o.height / row);
        o.chipCounts = col * row;
        for(var i = 0; i < row; i++){
            for(var j = 0; j < col; j++){
                var container = o.chipContainers[i * col + j].style;
                var chip = o.chips[i * col + j].style;
                chip.width = container.width = w + 'px';
                chip.height = container.height = h + 'px';
                chip.background = "url(" + url + ")";
                chip.backgroundPosition = (-j) * w + 'px '+ (-i) * h + 'px';
                chip.clip = "rect(0 0 0 0)";
                container = null;
                chip = null;
            };
        };
    };
    var getStyles = function (o) {
        var ranArr = [];
        if(o.stylesRandom){
            for(var i = 0; i < 2; i++){
                var randoms = Math.floor(513 * Math.random());
                if(randoms <256) ranArr.push(1);
                else if(randoms < 384) ranArr.push(2);
                else if(randoms < 448) ranArr.push(2);
                else if(randoms < 480) ranArr.push(4);
                else if(randoms < 496) ranArr.push(4);
                else if(randoms < 504) ranArr.push(6);
                else if(randoms < 508) ranArr.push(6);
                else if(randoms < 510) ranArr.push(8);
                else if(randoms < 511) ranArr.push(8);
                else ranArr.push(10);
            }
            var arr0Randoms = [0, 1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14];
            var arr1Randoms = [0, 1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 13, 14];
            var arr01Randoms = [0, 1, 2, 7, 8, 9, 10, 11, 12, 13, 14];
            var arrRandoms = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
            if((ranArr[0] == 1) && (ranArr[1] == 1)) {
                ranArr.push(arr01Randoms[Math.floor(11 * Math.random())]);
            } else if(ranArr[0] == 1) {
                ranArr.push(arr0Randoms[Math.floor(13 * Math.random())]);
            } else if(ranArr[1] == 1) {
                ranArr.push(arr1Randoms[Math.floor(13 * Math.random())]);
            } else {
                ranArr.push(arrRandoms[Math.floor(15 * Math.random())]);
            }
            o.styles = [ranArr];
        }else{
            var styles = [[1, 1, 3], [1, 5, 1], [1, 1, 0], [1, 1, 6], [1, 1, 1],
                [1, 8, 0], [1, 1, 0], [1, 1, 5], [4, 2, 0], [8, 2, 0],
                [1, 1, 3], [1, 1, 4], [4, 4, 0], [4, 4, 7], [4, 4, 11],
                [2, 4, 0]
            ];
            o.styles = o.stylesFlg ? (o.styles || styles)
                : (o.styles ? styles.concat(o.styles) : styles);
        }
    };
    var Shutter = function(option){
        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch (e) {};
        this.holder = option.holder;
        this.imgs = option.imgs || [];
        this.width = option.width;
        this.height = option.height;
        this.gridNumber = option.gridNumber || 50;
        this.imgInterval = option.imgInterval || 2000;
        this.slideInterval = option.slideInterval || 10;
        this.smoothness = option.smoothness || 100;
        this.stylesFlg = option.stylesFlg;
        this.stylesRandom = option.stylesRandom;
        this.slideTimer = null;
        this.changeImgTimer = null;
        this.links = [];
        this.idx = 0;
        this.imgLen = this.imgs.length;
        createContainer(this);
    };
    Shutter.prototype.play = function () {
        var me = this;
        getStyles(me);
        var curentSrc = me.imgs[me.idx % me.imgLen];
        var theMum = Math.round((me.styles.length - 1) * Math.random());
        var style = me.styles[theMum];
        if (me.prev) {
            me.prev.className = '';
        }
        me.prev = me.links[me.idx % me.imgLen];
        me.prev.className = 'current';
        addContainer(me, curentSrc, style[0], style[1]);
        var counter = 0;
        var slope = 0;
        me.slideTimer = setInterval(function () {
            for (var i = 0; i < me.chipCounts; i++) {
                var ht = me.chips[i].clientHeight;
                var wd = me.chips[i].clientWidth;
                slope = (counter++ / (me.smoothness * me.chipCounts));
                var _demp = kinds[style[2]].slice(0);
                for (var j = 0; j < 4; j++) {
                    var ps  = _demp[j];
                    _demp[j] = (ps >= 0) ? (j === 0) ? ht * (1 - slope) + 'px'
                        : ((j === 1) ? wd * slope + 'px' : ((j === 2)
                        ? ht * slope + 'px' : ((j === 3) ? wd * (1 - slope)
                            + 'px' : ''))) : 'auto';
                };
                moveClip(me.chips[i], _demp);
                if (slope === 1) {
                    me.container.style.background = 'url(' + curentSrc + ')';
                    clearTimeout(me.changeImgTimer);
                    clearInterval(me.slideTimer);
                    me.changeImgTimer = setTimeout(function (){
                        me.play.call(me);
                    }, me.imgInterval);
                    me.idx++;
                };
            };
        }, me.slideInterval);
    };
    return Shutter;
});