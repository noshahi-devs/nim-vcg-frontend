import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, BreadcrumbComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './email.component.html',
  styleUrl: './email.component.css'
})
export class EmailComponent implements OnInit {
  title = 'Messages';
  activeFolder: 'inbox' | 'sent' | 'starred' | 'bin' = 'inbox';
  messages: UserMessage[] = [];
  selectedMessage: UserMessage | null = null;
  loading = false;

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
    else if (this.activeFolder === 'starred') obs$ = this.messageService.getInbox(); // Filter local for now or add endpoint
    else obs$ = this.messageService.getInbox();

    obs$.subscribe({
      next: (data) => {
        if (this.activeFolder === 'starred') {
          this.messages = data.filter(m => m.isStarred);
        } else {
          this.messages = data;
        }
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
    this.loadMessages();
  }

  selectMessage(msg: UserMessage) {
    this.selectedMessage = msg;
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
      if (this.selectedMessage?.id === id) this.selectedMessage = null;
    });
  }

  onSubmitCompose() {
    if (!this.newMessage.receiverId || !this.newMessage.subject || !this.newMessage.content) return;

    this.messageService.sendMessage(this.newMessage).subscribe(() => {
      this.newMessage = { receiverId: '', subject: '', content: '' };
      // Close modal logic usually via ViewChild or simply reloading
      this.loadMessages();
    });
  }
}
