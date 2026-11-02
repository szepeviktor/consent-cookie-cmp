<?php

/*
 * Plugin Name: Consent Cookie CMP Example
 * Description: Minimal example plugin that injects the standalone CMP assets with wp_head and wp_footer hooks.
 */

add_action('wp_head', static function () {
    $cmp_url = content_url('cmp');
    ?>
    <!-- Consent Cookie CMP -->
    <link rel="stylesheet" href="<?php echo esc_url($cmp_url . '/klaro.css'); ?>">
    <link rel="stylesheet" href="<?php echo esc_url($cmp_url . '/cmp.css'); ?>">
    <script src="<?php echo esc_url($cmp_url . '/cmp-bootstrap.js'); ?>" data-gtm-id="GTM-XXXXXXX"></script>
    <?php
});

add_action('wp_footer', static function () {
    $cmp_url = content_url('cmp');
    ?>
    <!-- Consent Cookie CMP -->
    <script src="<?php echo esc_url($cmp_url . '/klaro-config.js'); ?>"></script>
    <script src="<?php echo esc_url($cmp_url . '/klaro.js'); ?>" defer></script>
    <?php
});
