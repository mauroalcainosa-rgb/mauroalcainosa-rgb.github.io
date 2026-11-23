/* Cuyi TV — actualiza el botón de país y el avatar de la cabecera */
(function(){
  function update(){
    var S = window.TVM; if(!S) return;
    var p = S.prefs(); var c = S.country(p.country || 'CL');
    var el = document.getElementById('cpill'); if(el) el.textContent = c.flag + ' ' + c.name;
    var a = document.getElementById('avatar'); if(a) a.textContent = (p.profile || 'P').charAt(0).toUpperCase();
  }
  update();
  window.addEventListener('hashchange', update);
  document.addEventListener('click', function(){ setTimeout(update, 50); });
})();
