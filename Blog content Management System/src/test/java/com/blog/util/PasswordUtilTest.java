package com.blog.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PasswordUtilTest {

    @Test
    public void testHashPassword() {
        String password = "mySecretPassword";
        String hash = PasswordUtil.hashPassword(password);
        
        assertNotNull(hash);
        assertNotEquals(password, hash);
    }

    @Test
    public void testCheckPassword() {
        String password = "password123";
        String hash = PasswordUtil.hashPassword(password);
        
        assertTrue(PasswordUtil.checkPassword(password, hash));
        assertFalse(PasswordUtil.checkPassword("wrongPassword", hash));
    }
}
