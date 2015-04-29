(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
})('edd', this, function () {

	var forEach = function (array, callback, scope) {
	  for (var i = 0; i < array.length; i++) {
	    callback.call(scope, i, array[i]); // passes back stuff we need
	  }
	};

	return function(opts) {
		// el - some div to create the input box in
		// onChange - when user changes the value in the input box (e.g. types)
		// onSelect - when user selects an option
		// onFocus - when user focuses an option (e.g. hover / arrow keys)

		var dropdown, input, focusElement, lastVal = '', touchstart;

		function renderDropdown(arr,selectIndex) {
			if (arr.length > 0) {

				var htmls = arr.map(function(entry,i) { 
					var classes = 'edd__entry' + (entry[0] === null ? ' edd__entry--info' : '');
					return '<div class="'+classes+'" data-val="'+entry[0]+'">'+entry[1]+'</div>';
				});
				dropdown.innerHTML = htmls.join('');
				dropdown.style.display = '';
				if(selectIndex !== undefined) {
					setFocusElement(dropdown.querySelector('*:nth-child('+(selectIndex+1)+')'));
				}					
			} else {
				dropdown.style.display = 'none';
				setFocusElement(null);
			}
		}

		function setFocusElement(el){
			if (focusElement) { 
				focusElement.className = 'edd__entry'; 
			}
			focusElement = null;
			if (el) {
				el.className += ' edd__entry--focus';
				focusElement = el;
			}
			opts.onFocus(el ? el.getAttribute('data-val') : null)
		}

		
		function onInputKeyUp(event) {
			var newVal = event.target.value;
			if (lastVal !== newVal && event.keyCode !== 13) {
				console.log('onchange');
				renderDropdown([]);
				opts.onChange(event.target.value, renderDropdown)
				lastVal = newVal;
			}
		}

		function onInputKeyDown(event) {
			var newFocusElement;

			if (event.keyCode === 13) { // RETURN
				if (focusElement) {
					var value = focusElement.getAttribute('data-val');
					if (value !== 'null') {
						//input.value = focusElement.textContent;
						input.value = '';
						opts.onSelect(value);
						renderDropdown([]);
					}					
				}
			} else if (event.keyCode === 40) { // DOWN ARROW
				newFocusElement = focusElement === null ? 
					dropdown.querySelector('*') : 
					focusElement.nextElementSibling || focusElement;

			} else if (event.keyCode === 38) { // UP ARROW
				newFocusElement = focusElement === null ?
					dropdown.querySelector('*') :
					focusElement.previousElementSibling || focusElement;
			}

			if (newFocusElement) {
				dropdown.style.display = '';
				setFocusElement(newFocusElement);
			}

			opts.onKeyDown(event);
		}

		function onDropdownClick(event) {
			console.log(event);
			var value = event.target.getAttribute('data-val') || event.target.parentElement.getAttribute('data-val');
			if (value !== 'null') {
				input.value = event.target.textContent;
				renderDropdown([]);
				opts.onSelect(value);
			}
		}
		function onBlur(event) {
			input.value="";
			renderDropdown([]);
		}
		function onDropdownMouseOver(event) {
			var toElement = event.target;
			if (/edd__entry/.test(toElement.className)) {
				setFocusElement(toElement);
			}		
		}

		// create elements
		input = document.createElement('input');
		input.className = 'edd__input';
		input.setAttribute('placeholder', opts.placeholder);
		input.type = 'text';
		dropdown = document.createElement('div');
		dropdown.className = 'edd__dropdown';

		// create listeners
		input.addEventListener('keyup', onInputKeyUp) ;
		input.addEventListener('keydown', onInputKeyDown) ;
		input.addEventListener('blur', onBlur) ;

		dropdown.addEventListener('mousedown', onDropdownClick);
		dropdown.addEventListener('mouseover', onDropdownMouseOver); 

		// dropdown.addEventListener('touchstart', onDropdownClick);
		// dropdown.addEventListener('touchend', onDropdownClick);

		opts.el.appendChild(input);
		opts.el.appendChild(dropdown);

		renderDropdown([]);
	}

}, this);