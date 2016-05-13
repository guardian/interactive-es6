let requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          (callback => window.setTimeout(callback, 1000 / 60));
})();

let cancelAnimFrame = (function() {
	return window.cancelAnimationFrame ||
		   window.webkitCancelAnimationFrame ||
		   window.mozCancelAnimationFrame ||
		   (timeout => window.clearTimeout(timeout));
})();

export {cancelAnimFrame, requestAnimFrame};
