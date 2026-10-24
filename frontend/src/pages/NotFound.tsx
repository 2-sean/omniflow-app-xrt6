import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <Compass className="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <h2 className="text-lg font-bold">页面走丢了</h2>
      <p className="mt-1 text-sm text-slate-500">这个地址没有对应的页面，回首页看看电费吧</p>
      <Button onClick={() => navigate('/')} className="mt-4 h-11 bg-blue-500 text-white hover:bg-blue-600">
        回到首页
      </Button>
    </section>
  );
};

export default NotFound;
