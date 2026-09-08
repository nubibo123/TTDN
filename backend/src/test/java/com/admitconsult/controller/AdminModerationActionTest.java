package com.admitconsult.controller;

import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.*;
import com.admitconsult.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminModerationActionTest {
    @Mock UserRoleRecordRepository userRoleRecordRepository;
    @Mock ForumPostRepository forumPostRepository;
    @Mock ForumThreadRepository forumThreadRepository;
    @Mock ThreadLikeRepository threadLikeRepository;
    @Mock UserRepository userRepository;
    @Mock UserPrincipal principal;
    @InjectMocks AdminController controller;

    private void admin() {
        when(principal.getId()).thenReturn("admin");
        when(userRoleRecordRepository.findByUserId("admin")).thenReturn(List.of(
                UserRoleRecord.builder().role(UserRoleRecord.UserRole.ADMIN).build()));
    }

    @Test void deleteOnlyDoesNotSuspendAuthor() {
        admin();
        var thread = ForumThread.builder().id("thread").authorId("author").build();
        when(forumThreadRepository.findById("thread")).thenReturn(Optional.of(thread));
        assertEquals(200, controller.deleteForumThread(principal, "thread", false).getStatusCode().value());
        verify(forumThreadRepository).delete(thread);
        verifyNoInteractions(userRepository);
    }

    @Test void combinedActionSuspendsTheStoredAuthor() {
        admin();
        var thread = ForumThread.builder().id("thread").authorId("author").build();
        var author = User.builder().id("author").isActive(true).build();
        when(forumThreadRepository.findById("thread")).thenReturn(Optional.of(thread));
        when(userRepository.findById("author")).thenReturn(Optional.of(author));
        assertEquals(200, controller.deleteForumThread(principal, "thread", true).getStatusCode().value());
        assertFalse(author.getIsActive());
        verify(userRepository).save(author);
        verify(forumThreadRepository).delete(thread);
    }

    @Test void cannotSuspendSelfAndDeletePost() {
        admin();
        when(forumThreadRepository.findById("thread")).thenReturn(Optional.of(
                ForumThread.builder().id("thread").authorId("admin").build()));
        assertEquals(400, controller.deleteForumThread(principal, "thread", true).getStatusCode().value());
        verify(forumThreadRepository, never()).delete(any());
        verifyNoInteractions(userRepository, threadLikeRepository);
    }

    @Test void nonAdminCannotDelete() {
        when(principal.getId()).thenReturn("student");
        when(userRoleRecordRepository.findByUserId("student")).thenReturn(List.of());
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.deleteForumThread(principal, "thread", true));
        verifyNoInteractions(forumThreadRepository, userRepository);
    }

    @Test void commentActionDeletesAndSuspendsAuthor() {
        admin();
        var post = ForumPost.builder().id("comment").authorId("author").build();
        var author = User.builder().id("author").isActive(true).build();
        when(forumPostRepository.findById("comment")).thenReturn(Optional.of(post));
        when(userRepository.findById("author")).thenReturn(Optional.of(author));
        assertEquals(200, controller.deleteForumPost(principal, "comment", true).getStatusCode().value());
        assertTrue(post.getIsDeleted());
        assertFalse(author.getIsActive());
        verify(forumPostRepository).save(post);
        verify(userRepository).save(author);
    }

    @Test void commentDeleteOnlyDoesNotSuspendAuthor() {
        admin();
        var post = ForumPost.builder().id("comment").authorId("author").build();
        when(forumPostRepository.findById("comment")).thenReturn(Optional.of(post));
        assertEquals(200, controller.deleteForumPost(principal, "comment", false).getStatusCode().value());
        assertTrue(post.getIsDeleted());
        verifyNoInteractions(userRepository);
    }
}
