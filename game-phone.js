//手机版捕获touchstart事件
//状态常量
var UNTOUCH = 0;
var TOUCHED = 1;

var colNum      = 4;
var rowNum      = 4;
var lowSpeedY   = 5;
var highSpeedY  = 10;
var speedUpTime = 20; 			//加速至最高速需用时间
var subScore    = 0.2;			//真男人模式每错一次扣除subScore%的分数
var outTime     = 120 * 1000; 	//真男人模式超时时间
var canvasRatio = 1; 			//游戏画面占屏幕的比例

var configURL      = 'default/config.json'; //默认的皮肤配置文件
var skinListURL    = 'config.json'; //皮肤列表配置文件
var isPlaying      = false;
var isPlayAudio    = true;
var isEndlessModel = false; //真男人模式

//表示一行
var Container = function(correctPos, correctType, posY, itemState) {
	this.posY        = posY;        //行顶端的位置
	this.itemState   = itemState;   //每一格的触摸状态
	this.correctPos  = correctPos;  //正确的格子位置
	this.correctType = correctType; //正确的格子类型
};
var imgsUntouch   = new Array(); //含每种类型的格子(未触摸）的image对象
var imgsTouched   = new Array(); //含每种类型的格子(已触摸）的image对象
var imgError      = new Image(); //发生错误(触摸到白格)时的image对象
var audiosCorrect = new Array(); //含每种类型的格子的audio对象
var audioError    = new Audio(); //发生错误时的audio对象

function changeSpeed() {
	if (speedY < highSpeedY && isPlaying == true) {
		speedY += (highSpeedY - lowSpeedY) / speedUpTime; //匀速增加
		setTimeout(function() {
			changeSpeed();
		}, 1000);
	}
}
//检查触摸是否正确及是否错过了某一格
//state: UNTOUCH && TOUCHED
//Y: 行 X: 列
function check(state, Y, X) {
	var isError;
	//一行完全下落
	if (state == UNTOUCH) {
		//检查是否有格子被触摸
		var isUntouch = true;
		for (var index in Panel[Y].itemState) {
			if (Panel[Y].itemState[index] == TOUCHED)
				isUntouch = false;
		}
		//若已被触摸则认为该事件已被处理，无需继续处理
		if (isUntouch == true) {
			isError = true;
		} else {
			return;
		}
	}
	//发生了触摸事件
	if (state == TOUCHED) {
		//检查触摸的是否为正确的格子
		if (X != Panel[Y].correctPos) {
			isError = true;
		} else {
			isError = false;
		}
	}

	if (isError == false) {
		if (isPlayAudio == true) {
			correctType = Panel[Y].correctType;
			audiosCorrect[correctType].play();
			//控制播放时间
			setTimeout(function() {
				audiosCorrect[correctType].pause();
				audiosCorrect[correctType].currentTime = 0;
			},200);
		}
		score += 1;
		//触摸开始按钮
		if (isPlaying == false && Y == rowNum - 1) {
			isPlaying = true;
			changeSpeed();
			animate();
		}
	} else {
		if (isPlayAudio == true) {
			audioError.play();
		}
		if (isEndlessModel == true) {
			score = Math.floor(score * (1 - subScore));
		} else {
			gameOverPage();
		}
	}
}
function animate() {
	context.clearRect(0, 0, width, height);

	for (var i = 0; i < rowNum; i++) {
		//某一行完全下落
		if (Panel[i].posY > height) {
			check(UNTOUCH, i);
			//重置
			Panel[i].posY        = 0 - rowHeight;
			Panel[i].correctPos  = Math.floor(Math.random() * colNum);
			Panel[i].correctType = Math.floor(Math.random() * typeNum);
			for (var index in Panel[i].itemState)
				Panel[i].itemState[index] = UNTOUCH;
		}

		for (var j = 0; j < colNum; j++) {
			var x = j * itemWidth;
			var y = Panel[i].posY;
			context.strokeRect(x, y, itemWidth, itemHeight);

			var correctPos  = Panel[i].correctPos;
			var correctType = Panel[i].correctType;
			if (j == correctPos) {
				if (Panel[i].itemState[j] == UNTOUCH) 
					//x+1、y+1 是为了避免与边界重合
					context.drawImage(imgsUntouch[correctType], x + 1, y + 1, itemWidth - 2, itemHeight - 2);
				else
					context.drawImage(imgsTouched[correctType], x + 1, y + 1, itemWidth - 2, itemHeight - 2);
			} 
			if (j != correctPos) {
				if (Panel[i].itemState[j] == TOUCHED) 
					context.drawImage(imgError, x + 1, y + 1, itemWidth - 2, itemHeight - 2);
			}
		}
		Panel[i].posY += speedY;
	}
	//绘制分数
	context.fillStyle = "RGB(255,0,0)";
	context.font      = "bold 30px serif";
	context.fillText(score, width / 2, 30);

	if (isPlaying == false) {
		var posX = itemWidth * Panel[rowNum - 1].correctPos + itemWidth / 4;
		var posY = Panel[rowNum - 1].posY + itemHeight / 2;
		context.fillText("开始", posX, posY);
	}
	if (isPlaying == true) {
		setTimeout(function() {
			animate();
		}, 33);
	}
}
function startGame() {
	Panel  = new Array();
	score  = 0;
	speedY = lowSpeedY; 

	//初始状态
	for (var i = 0; i < rowNum; i++) {
		var correctPos  = Math.floor(Math.random() * colNum);
		var correctType = Math.floor(Math.random() * typeNum);
		var posY = (i - 1) * rowHeight;
		var itemState = new Array(colNum);
		for (var index = 0; index < itemState.length; index++)
			itemState[index] = 0;
		Panel.push(new Container(correctPos, correctType, posY, itemState));
	}-

	animate();
	
	$('#gameCanvas').unbind('touchstart').on('touchstart',function(event) {
		//获取相对于Canvas的坐标
		var posX = event.clientX - canvasX;
		var posY = event.clientY - canvasY;
		var X = Math.floor(posX / itemWidth);
		for (var i = 0; i < Panel.length; i++) {
			if (posY > Panel[i].posY && posY < Panel[i].posY + rowHeight) {
				var Y = i;
				break;
			}
		}
		//对于重复触摸无需再处理
		if (Panel[Y].itemState[X] == TOUCHED)
			return;
		Panel[Y].itemState[X] = TOUCHED;

		check(TOUCHED, Y, X);
	});

	if (isEndlessModel == true) {
		setTimeout(function() {
			gameOverPage();
		}, outTime);
	}
}

function gameOverPage() {
	$('#game').hide();
	$('#end').fadeIn('fast').show();
	$('#endScore').html(score);	

	isPlaying = false;
	$('#playAgainBtn').unbind('touchstart').on('touchstart',function() {
		$('#end').hide();
		$('#game').fadeIn('fast').show();

		startGame();
	});
	$('#returnBtn').unbind('touchstart').on('touchstart',function() {
		$('#end').hide();
		$('#start').fadeIn('fast').show();
	});
}
function selectSkin() {
	config  = {};
	typeNum = 0;

	try {
		$.getJSON(configURL, function(data) {
			config  = data;
			typeNum = config["correctObject"].length;
			//为了避免使用同一个image/audio对象产生莫名其妙的问题
			//提前生成不同的对象保存到数组中
			for (var i in config.correctObject) {
				var imgUntouch   = new Image();
				var imgTouched   = new Image();
				var audioCorrect = new Audio();
				imgUntouch.src   = config.correctObject[i].imgUntouch;
				imgTouched.src   = config.correctObject[i].imgTouched;
				audioCorrect.src = config.correctObject[i].audio;
				imgsUntouch.push(imgUntouch);
				imgsTouched.push(imgTouched);
				audiosCorrect.push(audioCorrect);
			}
			imgError.src = config.errorObject.img;
			audioError.src = config.errorObject.audio;

			$('#startTitle').html(config.startTitle);
			$('#startIntro').html(config.startIntro);
			$('#endTitle').html(config.endTitle);
		});
	} catch (err) {
		alert("皮肤加载出错");
	}
}
function selectSkinPage() {
	var data = new Array();

	try {
		$('#selectSkin select').html('');
		$.getJSON(skinListURL, function(json) {
			data = json;
			for (var index in data) {
				$('#selectSkin select').append('<option value="' + index + '">' + data[index].name + "</option>");
			}
		});
	} catch (err) {
		alert("皮肤列表加载出错");
	}

	$('#selectSkinBtn').unbind('touchstart').on('touchstart',function() {
		var option = parseInt($('#selectSkin select').val());
		configURL  = data[option].configURL;

		$('#selectSkin').hide();
		selectSkin();
		$('#start').fadeIn('fast').show();
	});
}
$(document).ready(function() {
	context = $("#gameCanvas").get(0).getContext('2d');

	//注意直接在CSS中修改无效
	//必须修改width/height属性的值
	$('#gameCanvas').attr('width',$(window).width() * canvasRatio);
	$('#gameCanvas').attr('height',$(window).height());
	$('#gameCanvas').css('position','fixed');
	$('#gameCanvas').css('left',(1 - canvasRatio) * 50 + '%');
	$('#gameCanvas').css('top',0);

	canvasX = $('#gameCanvas').offset().left; //canvas左边界偏移距离
	canvasY = $('#gameCanvas').offset().top;  //canvas上边界偏移距离
	width  = $('#gameCanvas').width();
	height = $('#gameCanvas').height();
	rowWidth  = width;
	rowHeight = height / rowNum;
	itemWidth  = rowWidth / colNum;
	itemHeight = rowHeight;

	$('#normalStartBtn').on('touchstart',function() {
		$('#start').hide();
		$('#game').fadeIn('fast').show();

		isEndlessModel = false;
		startGame();
	});
	$('#endlessStartBtn').on('touchstart',function() {
		$('#start').hide();
		$('#game').fadeIn('fast').show();

		isEndlessModel = true;
		startGame();
	});
	$('#selectSkinLink').on('touchstart',function() {
		$('#start').hide();
		$('#selectSkin').fadeIn('fast').show();
		selectSkinPage();
	});
	function isPlayAudioDisplay() {
		if (isPlayAudio == false) {
			$('#isPlayAudio').html('音效:关');
		}
		if (isPlayAudio == true) {
			$('#isPlayAudio').html('音效:开');
		}
	}
	$('#isPlayAudio').on('touchstart',function() {
		if (isPlayAudio == false) {
			isPlayAudio = true; 
		} else {
			isPlayAudio = false;
		}
		isPlayAudioDisplay();
	})

	rowNum++; //要多生成一行避免出现间断
	selectSkin(configURL);
	isPlayAudioDisplay();
	$('#start').show();
	$('#selectSkin').hide();
	$('#game').hide();
	$('#end').hide();
});