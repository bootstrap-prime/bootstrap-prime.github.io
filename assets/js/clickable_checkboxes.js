const checkboxes = document.getElementsByClassName('task-list-item-checkbox');

Array.prototype.forEach.call(checkboxes, function (e) {
  e.removeAttribute('disabled');
});
