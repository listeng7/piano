//hardware back key
window.addEventListener('tizenhwkey', function onTizenHwKey(e) {
	if (e.keyName === 'back') {
		try {
			tizen.application.getCurrentApplication().exit();
		} catch (err) {
			console.log('Error: ', err);
		}
	}
});

jQuery(document).ready(function($) {
	var PPTrainer = (function() {

		var $pianoContainer = $('#pianoContainer'),
			$audio = $pianoContainer.find('audio'),
			$elemKeys = $pianoContainer.find('.key'),
			$info =  $pianoContainer.find('#info'),
			$repeatBtn = $pianoContainer.find('.repeat'),
			$overlay = $pianoContainer.find('.overlay'),
			$result = $pianoContainer.find('#result'),
			$tryAgainBtn = $result.children('#tryAgain'),
			$closeBtn = $result.children('#close'),
			keys = {},
			keysUrl = [ "sounds/C.mp3",
						"sounds/D.mp3",
						"sounds/E.mp3",
						"sounds/F.mp3",
						"sounds/G.mp3",
						"sounds/A.mp3",
						"sounds/B.mp3",
						"sounds/Db.mp3",
						"sounds/Eb.mp3",
						"sounds/Gb.mp3",
						"sounds/Ab.mp3",
						"sounds/Bb.mp3"];

		//initial setting
		function init () {
			
			$('.good').remove();
			generateKeys();
			training.start();
						
			//touch events
			$pianoContainer.on('touchstart', '.key', function(event) {
				var keyCode = $(this).data('keyCode');
				keys[keyCode].pressKey();

				$pianoContainer.one('touchend', '.key', function(event) {
					keys[keyCode].depressKey();
				});
			});
			
			$tryAgainBtn.click(function() {
				training.start();
				$overlay.fadeOut('fast');
			});

			$closeBtn.click(function() {
				var app = tizen.application.getCurrentApplication();
				app.exit();
			});
		}
		
		//generate piano keys object and load audiofiles
		function generateKeys () {
			$elemKeys.each(function(index, el) {
				var keyCode = $(el).data('keyCode');

				keys[keyCode] = new Key($(el), keysUrl[index]);
			});
		}
		
		//key constructor
		function Key ($elem, url) {
			this.$elem = $elem;
			this.audio = this.$elem.children('audio')[0];
			this.noteName =$elem.attr('id');
			this.pressed = false;

			//load audiofiles
			$(this.audio).attr('src', url);
		}

		//Parameter isUser shows who call function, user or not.
		//default false
		Key.prototype.play = function(isUser) {
			var audio = this.audio;

			if (audio.currentTime !== 0) {
				audio.currentTime = 0;
			}

			if (audio.paused) {
				audio.play();
			}

			$pianoContainer.trigger('piano.notePlaying', [{
				isUser : isUser || false,
				noteName : this.noteName
			}]);
		};

		Key.prototype.pressKey = function() {
			Key.prototype.play.call(this, true);
			this.pressed = true;

			if (this.$elem.hasClass('white')) {
				this.$elem.addClass('whitePressed');
			} else {
				this.$elem.addClass('blackPressed');
			}
		};

		Key.prototype.depressKey = function() {
			this.pressed = false;
			this.$elem.removeClass('blackPressed whitePressed');
			$pianoContainer.trigger('piano.keyDepressed');
		};


		var	training = (function(){
			var trainerNote, generatedNote,
				life = 5,
				stage = 0,
				playDelay = 1800,
				count = 1;

			function startTraining () {
				var context = this;

				context.isRunning = true;

				$pianoContainer.on('piano.notePlaying', function(event, played) {
					//if user press key, verify attempt
					if (played.isUser) {
						verifyAttempt(played.noteName, context);

 					//if random play, remember note name
					} else {
						trainerNote = played.noteName;
					}

					//display current result
					$info.html('Life: ' + life + 
					      		'&nbsp; &nbsp; &nbsp; Stage: ' + stage).show();
				});

				countdown(function () {
					randomPlay(100);
				})
			}

			function stopTraining () {
	
				//reset to init state
				clearInterval(interval);
				life = 5;
				stage = 0;
				count = 1;
				this.isRunning = false;
				$pianoContainer.off('piano.notePlaying');
				$info.html('Life: ' + life + 
					      		'&nbsp; &nbsp; &nbsp; Stage: ' + stage).show();
			}

			function randomPlay (delay) {
				var keyMass = Object.keys(keys),
					randomIndex = Math.floor(Math.random() * keyMass.length);
					
				generatedNote = keys[keyMass[randomIndex]];

				//if note repeated, generate again.	
				if (generatedNote.noteName === trainerNote) {
					randomPlay(playDelay);
				} else {
					setTimeout(function(){
						generatedNote.play();
					}, delay);
				}
			}

			function verifyAttempt (noteName, context) {
				//correct attempt
				if (trainerNote === noteName) {
					++stage;

					//show good
					$('#pianoContainer').before('<div class="good"></div>');
					
					//remove good after 1.8s
					setTimeout(function(){
					$('.good').remove();
					}, 1800); 

					//play audio after 1.9s
					randomPlay(1900);   

					$pianoContainer.trigger('piano.correct');

				//wrong attempt
				} else {
					--life;
					//if life is zero, stop training
					if (life === 0) {
						stopTraining.call(context);
						calculateTotal();
						return;
					}
					$pianoContainer.trigger('piano.incorrect');
				}			
			}
			
			function calculateTotal () {
				//show result
				$('#pianoContainer .overlay').css('z-index',3);
				$overlay.show();
				$result.show();
			}

			function countdown (callback) {
				interval = setInterval(function(){
					if (count === 1) {
						clearInterval(interval);
						count = 1;
						callback();
					}
					count--;
				}, 800);
			}

			$repeatBtn.on('touchstart', function() {
				
				$(this).addClass('repeatPressed');
				if (generatedNote) generatedNote.play();
				
				$repeatBtn.on('touchmove touchend', function() {
					$(this).removeClass('repeatPressed');
				});		
			});

			return {
				start : startTraining,
				stop : stopTraining,
				isRunning : false
			}
		})();

		//public methods
		return {
			init : init
		};
	})();
	
	PPTrainer.init();
});