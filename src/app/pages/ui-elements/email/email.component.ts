import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { UserMessage } from '../../../Models/user-message';
import { StaffService } from '../../../services/staff.service';
import { Staff } from '../../../Models/staff';
import { NotificationService } from '../../../services/notification.service';
import { forkJoin, map, of } from 'rxjs';
import { Notification } from '../../../Models/notification';

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './email.component.html',
  styleUrl: './email.component.css'
})
export class EmailComponent implements OnInit {
  title = 'Messages';
  activeFolder: 'inbox' | 'sent' | 'starred' | 'bin' | 'Internal' | 'Announcements' | 'Important' = 'inbox';
  messages: UserMessage[] = [];
  filteredMessages: UserMessage[] = [];
  selectedMessage: UserMessage | null = null;
  loading = false;
  searchQuery = '';
  showReplyBox = false;
  replyContent = '';

  get unreadMessages() {
    return this.messages.filter(m => !m.isRead);
  }

  get starredMessagesCount() {
    return this.messages.filter(m => m.isStarred).length;
  }

  // Compose
  allStaff: Staff[] = [];
  newMessage: Partial<UserMessage> = {
    receiverId: '',
    subject: '',
    content: ''
  };

  constructor(
    private messageService: MessageService,
    public authService: AuthService,
    private staffService: StaffService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadMessages();
    this.loadStaff();
  }

  loadMessages() {
    this.loading = true;
    let messagesObs$;

    if (this.activeFolder === 'starred') {
      messagesObs$ = forkJoin({
        inbox: this.messageService.getInbox(),
        sent: this.messageService.getSent()
      }).pipe(
        map(({ inbox, sent }) => {
          const combined = [...inbox, ...sent];
          // Filter unique IDs (in case someone sent a message to themselves)
          const seen = new Set();
          return combined
            .filter(m => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return m.isStarred;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        })
      );
    } else if (['Internal', 'Announcements', 'Important'].includes(this.activeFolder)) {
      messagesObs$ = this.notificationService.getNotifications().pipe(
        map(notifs => {
          const typeMap: any = {
            'Internal': 'Internal',
            'Announcements': 'Announcement',
            'Important': 'Important'
          };
          const targetType = typeMap[this.activeFolder] || this.activeFolder;
          return notifs
            .filter(n => n.notificationType?.toLowerCase() === targetType.toLowerCase() || n.notificationType === 'Broadcast')
            .map(n => this.mapNotificationToMessage(n))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        })
      );
    } else if (this.activeFolder === 'sent') {
      messagesObs$ = this.messageService.getSent();
    } else if (this.activeFolder === 'bin') {
      messagesObs$ = of([]); // Bin logic to be implemented or fetched if backend supports it
    } else {
      messagesObs$ = this.messageService.getInbox();
    }

    messagesObs$.pipe(
      finalize(() => {
        this.loading = false;
        this.filterMessages();
      })
    ).subscribe({
      next: (data: UserMessage[]) => {
        this.messages = data;
        this.filteredMessages = [...this.messages];
      },
      error: (err) => {
        console.error('Error loading messages:', err);
      }
    });
  }

  private mapNotificationToMessage(n: Notification): UserMessage {
    return {
      id: -n.id, // Negative ID to match backend logic for broadcasts
      senderId: 'System Broadcast',
      senderName: 'System Notification',
      receiverId: this.authService.userValue?.id || '',
      subject: n.title,
      content: n.message,
      isRead: n.isRead,
      isStarred: false,
      isDeletedIn: false,
      isDeletedOut: false,
      createdAt: n.createdAt
    };
  }

  loadStaff() {
    this.staffService.getAllStaffs().subscribe(data => this.allStaff = data);
  }

  switchFolder(folder: any) {
    this.activeFolder = folder;
    this.selectedMessage = null;
    this.showReplyBox = false;
    this.searchQuery = '';
    this.loadMessages();
  }

  filterMessages() {
    const q = this.searchQuery.toLowerCase();
    this.filteredMessages = this.messages.filter(m =>
      m.subject?.toLowerCase().includes(q) ||
      m.senderId?.toLowerCase().includes(q) ||
      m.content?.toLowerCase().includes(q)
    );
  }

  selectMessage(msg: UserMessage) {
    this.selectedMessage = msg;
    this.showReplyBox = false;
    this.replyContent = '';
    if (!msg.isRead && msg.receiverId === this.authService.userValue?.id) {
      this.messageService.markAsRead(msg.id).subscribe(() => {
        msg.isRead = true;
      });
    }
  }

  toggleStar(msg: UserMessage, event: Event) {
    event.stopPropagation();
    if (msg.id < 0) {
      msg.isStarred = !msg.isStarred;
      return;
    }
    
    // Optimistic UI update
    const previousState = msg.isStarred;
    msg.isStarred = !msg.isStarred;

    this.messageService.toggleStar(msg.id).subscribe({
      next: (res) => {
        // If backend returns the exact state, sync it, otherwise trust our optimistic toggle
        if (res && res.isStarred !== undefined) {
          msg.isStarred = res.isStarred;
        }
      },
      error: (err) => {
        console.error('Error toggling star:', err);
        msg.isStarred = previousState; // Revert on failure
      }
    });
  }

  deleteMessage(id: number, event: Event) {
    event.stopPropagation();
    if (id < 0) {
      // Handle notification deletion if service supports it, 
      // otherwise just remove from UI for this session.
      this.messages = this.messages.filter(m => m.id !== id);
      this.filteredMessages = this.filteredMessages.filter(m => m.id !== id);
      if (this.selectedMessage?.id === id) this.selectedMessage = null;
      return;
    }

    this.messageService.deleteMessage(id).subscribe(() => {
      this.messages = this.messages.filter(m => m.id !== id);
      this.filteredMessages = this.filteredMessages.filter(m => m.id !== id);
      if (this.selectedMessage?.id === id) this.selectedMessage = null;
    });
  }

  onSubmitCompose() {
    if (!this.newMessage.receiverId || !this.newMessage.subject || !this.newMessage.content) return;
    this.loading = true;
    this.messageService.sendMessage(this.newMessage).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.newMessage = { receiverId: '', subject: '', content: '' };
        this.loadMessages();
      },
      error: (err) => {
        console.error('Error sending message:', err);
      }
    });
  }

  replyTo(msg: UserMessage) {
    this.showReplyBox = true;
    this.replyContent = '';
    setTimeout(() => document.querySelector('textarea')?.focus(), 100);
  }

  sendReply(msg: UserMessage) {
    if (!this.replyContent.trim()) return;
    this.loading = true;
    const reply: Partial<UserMessage> = {
      receiverId: msg.senderId,
      subject: 'Re: ' + msg.subject,
      content: this.replyContent
    };
    this.messageService.sendMessage(reply).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.replyContent = '';
        this.showReplyBox = false;
      },
      error: (err) => {
        console.error('Error sending reply:', err);
      }
    });
  }

  getUnreadCount(): number {
    return this.messages.filter(m => !m.isRead).length;
  }

  getInitial(userId: string): string {
    if (!userId) return '?';
    return userId.charAt(0).toUpperCase();
  }
}
