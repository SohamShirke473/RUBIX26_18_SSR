"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { ArrowLeft, Loader2, AlertCircle, Trash2, CheckCircle2, BarChart3, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Id } from "../../../convex/_generated/dataModel";

const MessageViewer = ({ conversationId }: { conversationId: Id<"conversations"> }) => {
  const messages = useQuery(api.admin.getMessagesForAdmin, { conversationId });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          View Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conversation History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {messages === undefined ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin h-4 w-4" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">No messages.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div key={msg._id} className="text-sm bg-muted p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs">{msg.senderName || "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


const IssuesSection = () => {
  const issues = useQuery(api.issues.getAllIssues);
  const resolveIssue = useMutation(api.issues.resolveIssue);

  const handleResolve = async (issueId: Id<"issues">) => {
    try {
      await resolveIssue({ issueId, adminResponse: "Resolved by admin" });
    } catch (error) {
      console.error(error);
      alert("Failed to resolve issue");
    }
  };

  if (!issues) return null;

  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>User Reports & Issues</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <tr key={issue._id} className="border-b dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <Badge variant={issue.status === "solved" ? "default" : "destructive"} className="capitalize">
                        {issue.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-sm">{issue.title}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-xs" title={issue.description}>
                      {issue.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {issue.status !== "solved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleResolve(issue._id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                    No issues reported
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Verify admin access
  const isAdmin = useQuery(api.admin.verifyAdminUser, {});

  // Use "skip" if not admin to avoid errors
  const listings = useQuery(api.admin.getAllListingsForAdmin, isAdmin ? {} : "skip");
  const stats = useQuery(api.admin.getAdminStats, isAdmin ? {} : "skip");
  const conversations = useQuery(api.admin.getAllConversationsForAdmin, isAdmin ? {} : "skip");

  const resolveListing = useMutation(api.admin.resolveListing);
  const deleteListing = useMutation(api.admin.deleteListing);

  // Loading state
  const isLoading = isAdmin === undefined || (isAdmin && (listings === undefined || stats === undefined || conversations === undefined));
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="border-2 border-orange-500/50 dark:border-orange-600/50 bg-orange-100/20 dark:bg-orange-950/30 rounded-xl p-8 text-center flex flex-col items-center gap-4 max-w-md">
          <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          <div>
            <p className="text-orange-900 dark:text-orange-200 font-semibold text-lg mb-2">Access Denied</p>
            <p className="text-orange-800 dark:text-orange-300 text-sm">You do not have permission to access the admin dashboard.</p>
          </div>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleResolve = async (listingId: string) => {
    try {
      await resolveListing({ listingId: listingId as any });
    } catch (err) {
      console.error("Failed to resolve listing:", err);
      alert("Failed to resolve listing");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteListing({ listingId: deletingId as any });
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch (err) {
      console.error("Failed to delete listing:", err);
      alert("Failed to delete listing");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="bg-teal-500 h-2 w-full" />
      <div className="container py-10 px-4">
        <Button
          onClick={() => router.push("/")}
          variant="ghost"
          className="mb-8 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all font-bold uppercase text-xs tracking-widest group p-0 hover:bg-transparent dark:hover:bg-transparent"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage listings and view platform statistics</p>
        </div>

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalListings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.openListings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Matched</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.matchedListings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.resolvedListings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lost Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.lostListings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Found Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">{stats.foundListings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.uniqueUsers}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversations Table */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Listing</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Last Message</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations && conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <tr key={conv._id} className="border-b dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <Link href={`/listings/${conv.listingId}`} className="hover:text-teal-600 transition flex items-center gap-2">
                            {conv.listingImage && (
                              <div className="h-8 w-8 rounded overflow-hidden relative border bg-muted">
                                <Image
                                  src={conv.listingImage}
                                  alt="Item"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="font-medium text-sm truncate max-w-xs">
                              {conv.listingTitle}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-xs">
                          {conv.lastMessage || "No messages yet"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString() : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <MessageViewer conversationId={conv._id} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-muted-foreground">
                        No conversations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Issues Table */}
        <IssuesSection />

        {/* Listings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Posted</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings && listings.length > 0 ? (
                    listings.map((listing) => (
                      <tr key={listing._id} className="border-b dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <Link href={`/listings/${listing._id}`} className="hover:text-teal-600 transition">
                            <div className="font-medium text-sm truncate max-w-xs">
                              {listing.title}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={listing.type === "lost" ? "destructive" : "default"} className="capitalize">
                            {listing.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              listing.status === "open"
                                ? "outline"
                                : listing.status === "matched"
                                  ? "secondary"
                                  : "default"
                            }
                            className="capitalize text-xs"
                          >
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {listing.categories[0]?.replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 text-sm truncate max-w-xs text-muted-foreground">
                          {listing.locationName}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {listing.status !== "resolved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleResolve(listing._id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => {
                                setDeletingId(listing._id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground">
                        No listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The listing and all associated messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
