<?php

/*
 * Plugin Name: Consent Cookie CMP Example
 * Description: Minimal example plugin that injects the standalone CMP assets with wp_head and wp_footer hooks.
 */

add_action('wp_head', static function () {
    ?>
    <!-- Consent Cookie CMP -->
    <link rel="stylesheet" href="/cmp/klaro.css">
    <link rel="stylesheet" href="/cmp/cmp.css">
    <script src="/cmp/cmp-bootstrap.js" data-gtm-id="GTM-XXXXXXX"></script>
    <?php
});

add_action('wp_footer', static function () {
    ?>
    <!-- Consent Cookie CMP -->
    <script src="/cmp/klaro-config.js"></script>
    <script src="/cmp/klaro.js" defer></script>
    <?php
});
