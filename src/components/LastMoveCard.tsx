"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LastMoveItem, logAction } from "@/lib/actions";
import { daysSince } from "@/lib/utils";
import { Clock, CheckCircle } from "lucide-react";
import { gsap } from "gsap";

interface LastMoveCardProps {
  item: LastMoveItem;
}

export default function LastMoveCard({ item }: LastMoveCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const days = daysSince(item.last_action_at);

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

  const handleLogAction = async () => {
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
      await logAction(item.id);
    } catch (error) {
      console.error("Failed to log action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysColor = (days: number) => {
    if (days === 0) return "text-green-600";
    if (days <= 3) return "text-yellow-600";
    if (days <= 7) return "text-orange-600";
    return "text-red-600";
  };

  const getDaysText = (days: number) => {
    if (days === 0) return "오늘";
    if (days === 1) return "1일 전";
    return `${days}일 전`;
  };

  return (
    <Card
      ref={cardRef}
      className="hover:shadow-lg transition-shadow duration-200"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          {item.category && <Badge variant="secondary">{item.category}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={`font-semibold ${getDaysColor(days)}`}>
              {getDaysText(days)}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            총 {item.action_count}회 실행
          </div>

          <Button
            onClick={handleLogAction}
            disabled={isLoading}
            className="w-full"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? "처리 중..." : "완료 표시"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
