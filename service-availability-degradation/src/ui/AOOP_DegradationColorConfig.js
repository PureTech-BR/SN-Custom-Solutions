var AOOP_DegradationColorConfig = Class.create();
AOOP_DegradationColorConfig.prototype = Object.extendsObject(AbstractAjaxProcessor, {
 getRanges: function() { return JSON.stringify(this._ranges()); },
 _ranges: function() {
  var fallback=[{"max":25,"color":"green"},{"max":50,"color":"yellow"},{"max":75,"color":"orange"},{"max":100,"color":"red"}];
  try {
   var a=JSON.parse(gs.getProperty('aoop_service_availability_degradation_color_ranges',JSON.stringify(fallback)));
   if(Object.prototype.toString.call(a)!=='[object Array]'||a.length!==4) return fallback;
   var previous=-1, allowed={green:1,yellow:1,orange:1,red:1};
   for(var i=0;i<a.length;i++) {
    var r=a[i];
    if(!r||typeof r.max!=='number'||!isFinite(r.max)||r.max<0||r.max>100||r.max<=previous||!allowed[r.color])return fallback;
    previous=r.max;
   }
   return previous===100?a:fallback;
  } catch(e) { return fallback; }
 },
 _colorForRecord: function(record) {
  if(!record || record.getValue('u_degradation_calculated')!=='1'||record.u_absolute_degradation.nil())return '';
  var n=Number(record.getValue('u_absolute_degradation'));
  if(!isFinite(n)||n<0||n>100)return '';
  var a=this._ranges();
  for(var i=0;i<a.length;i++)if(n<=a[i].max)return a[i].color;
  return '';
 },
 type: 'AOOP_DegradationColorConfig'
});
