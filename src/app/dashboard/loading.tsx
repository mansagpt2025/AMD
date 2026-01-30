
export default function Loading() {

  return (
    <div className="loadingContainer">
      <div className="loadingContent">
        {/* شعار المنصة */}
        <div className="logoSection">
          <div className="logoAnimation">
            <h1 className="mainTitle">جاري التحميل ...</h1>
          </div>
          
          <div className="titleSection">
            <h1 className="mainTitle">البارع محمود الديب</h1>
            <p className="subtitle">منصة تعليم اللغة العربية للثانوية العامة</p>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="progressContainer">
          <div className="progressBar">
            <div 
              className="progressFill"
            >
              <div className="progressGlow"></div>
            </div>
          </div>
          <div className="progressText">
            <span className="progressPercent">100%</span>
            <span className="progressPhase">جاري التحميل...</span>
          </div>
      </div>
      </div>
    </div>
  );
};
