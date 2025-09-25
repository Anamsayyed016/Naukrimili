'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  jobCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        setNewCategory({ name: '', description: '' });
        setShowAddForm(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleToggleStatus = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error updating category status:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
        <p className="text-gray-600 mt-2">Manage job categories and sectors</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category Name</label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Technology, Healthcare, Finance"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Brief description of the category"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Category</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading categories...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{category.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.jobCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(category.id, category.isActive)}
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredCategories.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No categories found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}