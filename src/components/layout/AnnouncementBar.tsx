const AnnouncementBar = () => {
  const topBarText = "🎉 Grand Opening Offer: Flat 20% OFF on all orders! Use Code: TABLET20 💊 Free Shipping on orders above ₹999 📦 Same Day Delivery available in select cities 💰 Up to 85% discount on imported medicines";

  return (
    <div 
      className="relative z-[60] overflow-hidden flex text-xs sm:text-sm"
      style={{
        background: 'hsl(262 83% 35%)',
        color: 'white',
        padding: '0.5rem 0',
      }}
    >
      <div className="marquee-track">
        <div className="marquee-content">
          {topBarText} &nbsp;&nbsp;•&nbsp;&nbsp; {topBarText} &nbsp;&nbsp;•&nbsp;&nbsp;
        </div>
        <div className="marquee-content">
          {topBarText} &nbsp;&nbsp;•&nbsp;&nbsp; {topBarText} &nbsp;&nbsp;•&nbsp;&nbsp;
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
