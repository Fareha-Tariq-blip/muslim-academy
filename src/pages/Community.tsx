import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommunityReviews from '@/components/home/CommunityReviews';

const Community = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-20">
        <CommunityReviews />
      </div>
      <Footer />
    </div>
  );
};

export default Community;
