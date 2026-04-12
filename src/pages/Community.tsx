import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommunityReviews from '@/components/home/CommunityReviews';

const Community = () => {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Page header banner */}
      <div className="page-header-banner pt-24 pb-12">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-[hsl(40,30%,96%)] md:text-5xl">
            Our <span className="text-[hsl(174,55%,55%)]">Community</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[hsl(40,20%,80%)]">
            Read reviews and share your experience with Muslim Academy.
          </p>
        </div>
      </div>
      <CommunityReviews />
      <Footer />
    </div>
  );
};

export default Community;
