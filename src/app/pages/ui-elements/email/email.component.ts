import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { UserMessage } from '../../../Models/user-message';
import { StaffService } from '../../../services/staff.service';
import { Staff } from '../../../Models/staff';

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
  activeFolder: 'inbox' | 'sent' | 'starred' | 'bin' = 'inbox';
  messages: UserMessage[] = [];
  filteredMessages: UserMessage[] = [];
  selectedMessage: UserMessage | null = null;
  loading = false;
  searchQuery = '';
  showReplyBox = false;
  replyContent = '';

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
    private staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.loadMessages();
    this.loadStaff();
  }

  loadMessages() {
    this.loading = true;
    let obs$;
    if (this.activeFolder === 'inbox') obs$ = this.messageService.getInbox();
    else if (this.activeFolder === 'sent') obs$ = this.messageService.getSent();
    else if (this.activeFolder === 'starred') obs$ = this.messageService.getInbox();
    else obs$ = this.messageService.getInbox();

    obs$.subscribe({
      next: (data) => {
        if (this.activeFolder === 'starred') {
          this.messages = data.filter(m => m.isStarred);
        } else {
          this.messages = data;
        }
        this.filteredMessages = [...this.messages];
        this.loading = false;
      },
      error: () => this.loading = false
    });
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
    this.messageService.toggleStar(msg.id).subscribe(res => {
      msg.isStarred = res.isStarred;
    });
  }

  deleteMessage(id: number, event: Event) {
    event.stopPropagation();
    this.messageService.deleteMessage(id).subscribe(() => {
      this.messages = this.messages.filter(m => m.id !== id);
      this.filteredMessages = this.filteredMessages.filter(m => m.id !== id);
      if (this.selectedMessage?.id === id) this.selectedMessage = null;
    });
  }

  onSubmitCompose() {
    if (!this.newMessage.receiverId || !this.newMessage.subject || !this.newMessage.content) return;
    this.messageService.sendMessage(this.newMessage).subscribe(() => {
      this.newMessage = { receiverId: '', subject: '', content: '' };
      this.loadMessages();
    });
  }

  replyTo(msg: UserMessage) {
    this.showReplyBox = true;
    this.replyContent = '';
    setTimeout(() => document.querySelector('textarea')?.focus(), 100);
  }

  sendReply(msg: UserMessage) {
    if (!this.replyContent.trim()) return;
    const reply: Partial<UserMessage> = {
      receiverId: msg.senderId,
      subject: 'Re: ' + msg.subject,
      content: this.replyContent
    };
    this.messageService.sendMessage(reply).subscribe(() => {
      this.replyContent = '';
      this.showReplyBox = false;
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
