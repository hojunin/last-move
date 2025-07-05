"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityWithLastMove, createMove } from "@/lib/actions";
import { daysSince } from "@/lib/utils";
import { Clock } from "lucide-react";
import { gsap } from "gsap";
import dayjs from "dayjs";
import LastMoveDetailModal from "@/components/LastMoveDetailModal";

interface LastMoveCardProps {
  item: ActivityWithLastMove;
}

export default function LastMoveCard({ item }: LastMoveCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // NOTE: 마지막 실행일로부터 경과 일수 계산
  const days = item.last_executed_at ? daysSince(item.last_executed_at) : null;

  // NOTE: 오늘 이미 완료했는지 확인 (last_move_date 사용)
  const isCompletedToday = Boolean(
    item.last_move_date && dayjs(item.last_move_date).isSame(dayjs(), "day")
  );

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  const handleLogAction = async (e: React.MouseEvent) => {
    // NOTE: 이벤트 버블링 방지
    e.stopPropagation();

    if (isCompletedToday) return;

    setIsLoading(true);

    // NOTE: 버튼 클릭 애니메이션
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
    }

    try {
      const result = await createMove(item.id);
      if (!result.success) {
        alert(result.error || "Move 기록에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to log action:", error);
      alert("Move 기록 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    setIsDetailModalOpen(true);
  };

  const getDaysColor = (days: number | null) => {
    if (days === null) return "text-gray-600";
    if (days === 0) return "text-green-600";
    if (days <= 3) return "text-yellow-600";
    if (days <= 7) return "text-orange-600";
    return "text-red-600";
  };

  const getDaysText = (days: number | null) => {
    if (days === null) return "No record";
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleCardClick}
        className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-shadow duration-200 h-fit cursor-pointer"
      >
        <div className="space-y-1.5">
          {/* 제목과 카테고리 */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm truncate pr-2 leading-tight">
              {item.title}
            </h3>
            {item.category && (
              <Badge
                variant="secondary"
                className="text-xs shrink-0 h-4 px-1.5"
              >
                {item.category}
              </Badge>
            )}
          </div>

          {/* 경과 시간과 완료 버튼 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={`text-xs font-medium ${getDaysColor(days)}`}>
                {getDaysText(days)}
              </span>
            </div>

            <Button
              onClick={handleLogAction}
              disabled={isLoading || isCompletedToday}
              variant={isCompletedToday ? "secondary" : "default"}
              size="sm"
              className="h-5 px-2 text-xs"
            >
              {isLoading ? "Processing" : isCompletedToday ? "✓" : "Done"}
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <LastMoveDetailModal
        activityId={item.id}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </>
  );
}
