<?php

/*
 * Plugin Name: Consent Cookie CMP Example
 * Description: Minimal example plugin that injects the standalone CMP assets with wp_head and wp_footer hooks.
 * Version: 0.1.0
 */

declare(strict_types=1);

add_action('wp_head', static function (): void {
    ?>
    <link rel="stylesheet" href="/cmp/klaro.css">
    <link rel="stylesheet" href="/cmp/cmp.css">
    <script src="/cmp/cmp-bootstrap.js" data-gtm-id="GTM-XXXXXXX"></script>
    <?php
});

add_action('wp_footer', static function (): void {
    ?>
    <script src="/cmp/klaro-config.js"></script>
    <script src="/cmp/klaro.js" defer></script>
    <?php
});
