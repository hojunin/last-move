'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// NOTE: 동적 렌더링 강제 (GSAP로 인한 SSR 문제 해결)
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: ReturnType<typeof import('gsap').gsap.context>;

    // GSAP를 동적으로 로드
    const loadGSAP = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // 히어로 섹션 애니메이션
        const tl = gsap.timeline();

        tl.from('.hero-title', {
          y: 100,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
        })
          .from(
            '.hero-subtitle',
            {
              y: 50,
              opacity: 0,
              duration: 1,
              ease: 'power3.out',
            },
            '-=0.5',
          )
          .from(
            '.hero-description',
            {
              y: 30,
              opacity: 0,
              duration: 0.8,
              ease: 'power3.out',
            },
            '-=0.3',
          );

        // 스크롤 기반 애니메이션
        gsap.utils.toArray('.animate-on-scroll').forEach((element) => {
          gsap.from(element as Element, {
            y: 100,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element as Element,
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          });
        });

        // 카드 애니메이션
        gsap.utils.toArray('.example-card').forEach((card, index) => {
          gsap.from(card as Element, {
            x: index % 2 === 0 ? -100 : 100,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card as Element,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          });
        });

        // 알림 섹션 특별 애니메이션
        gsap.from('.notification-icon', {
          scale: 0,
          rotation: 180,
          duration: 1.5,
          ease: 'elastic.out(1, 0.3)',
          scrollTrigger: {
            trigger: '.notification-section',
            start: 'top 70%',
          },
        });

        // CTA 버튼 애니메이션
        gsap.from('.cta-button', {
          scale: 0.8,
          opacity: 0,
          duration: 1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.cta-section',
            start: 'top 80%',
          },
        });
      }, containerRef);
    };

    loadGSAP();

    return () => {
      if (ctx) {
        ctx.revert();
      }
    };
  }, []);

  const handleGetStarted = async () => {
    try {
      // 세션 상태 확인을 위해 API 호출
      const response = await fetch('/api/auth/session');
      const session = await response.json();

      if (session?.user) {
        router.push('/');
      } else {
        router.push('/auth/signin');
      }
    } catch {
      // 에러 시 로그인 페이지로 이동
      router.push('/auth/signin');
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      >
        {/* 배경 효과 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center z-10 max-w-4xl mx-auto">
          <h1 className="hero-title text-6xl md:text-8xl font-bold text-white mb-6">
            LastMove
          </h1>
          <p className="hero-subtitle text-2xl md:text-3xl text-purple-300 mb-8">
            마지막으로 언제 했었지?
          </p>
          <p className="hero-description text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            일상의 소중한 순간들을 기록하고, 놓치지 않도록 도와드립니다.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-on-scroll text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              이런 경험 있으시죠?
            </h2>
            <p className="text-xl text-slate-300">
              일상의 작은 것들, 언제 했는지 기억이 안 날 때가 있어요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-on-scroll bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                기억이 안나요
              </h3>
              <p className="text-slate-300">
                &ldquo;마지막으로 운동한 게 언제였지?&rdquo;
                <br />
                &ldquo;면도날을 언제 갈았더라?&rdquo;
              </p>
            </div>

            <div className="animate-on-scroll bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                시간이 흘러요
              </h3>
              <p className="text-slate-300">
                바쁜 일상 속에서
                <br />
                중요한 것들을 놓치기 쉬워요
              </p>
            </div>

            <div className="animate-on-scroll bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">💡</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                해결책이 있어요
              </h3>
              <p className="text-slate-300">
                LastMove가 당신의
                <br />
                기억을 도와드릴게요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section ref={examplesRef} className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="animate-on-scroll text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              이런 것들을 기록해보세요
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="example-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">🏠</div>
                <h3 className="text-2xl font-bold text-white">생활 관리</h3>
              </div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  마지막 청소: 3일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  침구 교체: 1주일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  화분 물주기: 2일 전
                </li>
              </ul>
            </div>

            <div className="example-card bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">💪</div>
                <h3 className="text-2xl font-bold text-white">건강 관리</h3>
              </div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  면도날 교체: 2주 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  운동: 4일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  건강검진: 6개월 전
                </li>
              </ul>
            </div>

            <div className="example-card bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">🎯</div>
                <h3 className="text-2xl font-bold text-white">습관 관리</h3>
              </div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  독서: 5일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  명상: 1일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  일기 쓰기: 3일 전
                </li>
              </ul>
            </div>

            <div className="example-card bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">⚠️</div>
                <h3 className="text-2xl font-bold text-white">주의 관리</h3>
              </div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                  음주: 1주일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                  야식: 3일 전
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                  게임: 2일 전
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Section */}
      <section
        ref={notificationRef}
        className="notification-section py-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-on-scroll mb-8">
            <div className="notification-icon text-8xl mb-6">🔔</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              알림으로 놓치지 마세요
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              중요한 일들을 적절한 시점에 알려드려요
            </p>
          </div>

          <div className="animate-on-scroll grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-3xl mb-3">⏰</div>
              <h3 className="text-lg font-bold text-white mb-2">
                일일 리마인더
              </h3>
              <p className="text-sm text-slate-300">
                매일 해야 하는 일들을 놓치지 않도록
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-lg font-bold text-white mb-2">주간 알림</h3>
              <p className="text-sm text-slate-300">
                주 단위로 확인이 필요한 것들
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-white mb-2">성취 축하</h3>
              <p className="text-sm text-slate-300">
                연속 기록 달성을 축하해드려요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="cta-section py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-on-scroll mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              지금 시작해보세요
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              더 나은 일상 관리의 첫 걸음을 내딛어보세요
            </p>
          </div>

          <Button
            onClick={handleGetStarted}
            className="cta-button bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            시작하기 →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400">
            © 2024 LastMove. 더 나은 일상을 위한 첫 걸음.
          </p>
        </div>
      </footer>
    </div>
  );
}
