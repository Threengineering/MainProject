import { supabase } from '../supabaseClient'; // 아까 만든 설정 파일 불러오기

const Login = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // 로그인 후 현재 주소로 리다이렉트
      },
    });

    if (error) console.error('로그인 에러:', error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">PROTO:MIRACLE</h1>
        <p className="text-gray-500 mb-8 text-sm">바쁜 현대인을 위한 대시보드</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all shadow-sm font-medium text-gray-700"
        >
          <img className="w-5 h-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          구글 계정으로 로그인
        </button>
      </div>
    </div>
  );
};

export default Login;