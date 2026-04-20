import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommunityReviews from '@/components/home/CommunityReviews';

const Reviews = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-header-banner pt-24 pb-12">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-[hsl(40,30%,96%)] md:text-5xl">
            Reviews & <span className="text-[hsl(174,55%,55%)]">Stories</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[hsl(40,20%,80%)]">
            Read what parents, students, and teachers say about Muslim Academy — and share your own.
          </p>
        </div>
      </div>
      <CommunityReviews hideHeader />
      <Footer />
    </div>
  );
};

export default Reviews;
