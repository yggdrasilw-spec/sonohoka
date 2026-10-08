// Existing regression suites exercise solving. Presentation is tested separately
// through real UI transitions in qa-linear-presentation.cjs.
module.exports=async page=>page.evaluate(()=>{
 const initialize=initLessonTask;
 initLessonTask=function(){initialize();lessonState.phase='solve';};
 const open=openWordLab;
 openWordLab=function(index=null){open(index);if(index!==null){wordState.phase='solve';renderWordLab();}};
});
