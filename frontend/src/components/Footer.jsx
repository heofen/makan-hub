import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="glass-panel-dark backdrop-blur-lg py-8 px-4 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-music-primary to-music-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xl">М</span>
              </div>
              <span className="text-white text-xl font-semibold">Makan<span className="text-music-secondary">Hub</span></span>
            </Link>
            <p className="mt-4 text-white/60 text-sm">
              Стриминговый сервис с богатой коллекцией музыки и подкастов.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Компания</h3>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/about" className="hover:text-white transition-colors">О нас</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Вакансии</Link></li>
              <li><Link to="/press" className="hover:text-white transition-colors">Для прессы</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Сообщества</h3>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/for-artists" className="hover:text-white transition-colors">Для артистов</Link></li>
              <li><Link to="/developers" className="hover:text-white transition-colors">Разработчикам</Link></li>
              <li><Link to="/advertising" className="hover:text-white transition-colors">Реклама</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Помощь</h3>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/support" className="hover:text-white transition-colors">Поддержка</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Конфиденциальность</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Условия использования</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/70 text-sm mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} MakanHub. Все права защищены.
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <SocialLink href="#" icon="facebook" />
            <SocialLink href="#" icon="twitter" />
            <SocialLink href="#" icon="instagram" />
          </div>
        </div>
      </div>
    </footer>
  );
};

// Компонент для социальных иконок
const SocialLink = ({ href, icon }) => {
  const icons = {
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.036 10.036 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.218-1.79.465-2.428.254-.66.599-1.216 1.153-1.772.5-.509 1.105-.902 1.772-1.153.637-.247 1.363-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.8c-2.67 0-2.986.01-4.04.06-.976.045-1.505.207-1.858.344-.466.181-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.055-.06 1.37-.06 4.04 0 2.67.01 2.987.06 4.04.045.977.207 1.505.344 1.858.181.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.046 1.37.06 4.04.06 2.67 0 2.987-.01 4.04-.06.977-.045 1.505-.207 1.858-.344.466-.181.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.055.06-1.37.06-4.04 0-2.67-.01-2.986-.06-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.047-1.37-.06-4.04-.06zm0 3.064A5.139 5.139 0 0017.136 12 5.139 5.139 0 0012 17.136 5.139 5.139 0 006.864 12 5.139 5.139 0 0012 6.864zm0 8.476A3.339 3.339 0 018.664 12 3.337 3.337 0 0112 8.664 3.337 3.337 0 0115.336 12 3.337 3.337 0 0112 15.336zm6.192-8.68c0 .76-.616 1.378-1.378 1.378a1.38 1.38 0 01-1.378-1.378c0-.76.616-1.378 1.378-1.378a1.38 1.38 0 011.378 1.378z" />
      </svg>
    ),
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-white/60 hover:text-white transition-colors"
    >
      {icons[icon]}
    </a>
  );
};

export default Footer; 