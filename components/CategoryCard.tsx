import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    count: number;
    description?: string;
    icon?: string;
  };
  onClick?: (categoryId: string) => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => onClick?.(category.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
          {category.icon && (
            <span className="text-2xl">{category.icon}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {category.description || 'Browse available positions'}
          </p>
          <Badge variant="secondary">
            {category.count} jobs
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}