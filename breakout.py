import pygame
import sys
import random

pygame.init()

WIDTH, HEIGHT = 800, 600
FPS = 60

BLACK  = (0,   0,   0)
WHITE  = (255, 255, 255)
CYAN   = (0,   200, 220)
ORANGE = (255, 140,  0)
GRAY   = (60,  60,  60)
RED    = (220,  50,  50)
GREEN  = (50,  200,  80)
YELLOW = (240, 220,  30)

BLOCK_COLS   = 10
BLOCK_ROWS   = 5
BLOCK_WIDTH  = 68
BLOCK_HEIGHT = 22
BLOCK_PADDING = 4
BLOCK_OFFSET_X = 26
BLOCK_OFFSET_Y = 60

BLOCK_COLORS = [RED, ORANGE, YELLOW, GREEN, CYAN]

PADDLE_WIDTH  = 110
PADDLE_HEIGHT = 14
PADDLE_SPEED  = 7
PADDLE_Y      = HEIGHT - 50

BALL_RADIUS = 9
BALL_SPEED  = 5


class Paddle:
    def __init__(self):
        self.rect = pygame.Rect(
            (WIDTH - PADDLE_WIDTH) // 2, PADDLE_Y,
            PADDLE_WIDTH, PADDLE_HEIGHT
        )

    def update(self, keys):
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.rect.x -= PADDLE_SPEED
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.rect.x += PADDLE_SPEED
        self.rect.clamp_ip(pygame.Rect(0, 0, WIDTH, HEIGHT))

    def draw(self, surface):
        pygame.draw.rect(surface, WHITE, self.rect, border_radius=7)


class Ball:
    def __init__(self):
        self.reset()

    def reset(self):
        self.x = WIDTH // 2
        self.y = PADDLE_Y - BALL_RADIUS - 2
        angle_offset = random.choice([-1, 1]) * random.uniform(0.3, 0.9)
        self.vx = BALL_SPEED * angle_offset
        self.vy = -BALL_SPEED
        self.active = False

    def update(self, paddle):
        if not self.active:
            self.x = paddle.rect.centerx
            self.y = PADDLE_Y - BALL_RADIUS - 2
            return True

        self.x += self.vx
        self.y += self.vy

        if self.x - BALL_RADIUS <= 0:
            self.x = BALL_RADIUS
            self.vx = abs(self.vx)
        if self.x + BALL_RADIUS >= WIDTH:
            self.x = WIDTH - BALL_RADIUS
            self.vx = -abs(self.vx)
        if self.y - BALL_RADIUS <= 0:
            self.y = BALL_RADIUS
            self.vy = abs(self.vy)

        if self.y + BALL_RADIUS >= HEIGHT:
            return False

        ball_rect = pygame.Rect(
            self.x - BALL_RADIUS, self.y - BALL_RADIUS,
            BALL_RADIUS * 2, BALL_RADIUS * 2
        )
        if ball_rect.colliderect(paddle.rect) and self.vy > 0:
            offset = (self.x - paddle.rect.centerx) / (PADDLE_WIDTH / 2)
            self.vx = BALL_SPEED * offset * 1.1
            self.vy = -abs(self.vy)
            self.y = paddle.rect.top - BALL_RADIUS

        return True

    def draw(self, surface):
        pygame.draw.circle(surface, CYAN, (int(self.x), int(self.y)), BALL_RADIUS)
        pygame.draw.circle(surface, WHITE, (int(self.x) - 3, int(self.y) - 3), 3)


def make_blocks():
    blocks = []
    for row in range(BLOCK_ROWS):
        for col in range(BLOCK_COLS):
            x = BLOCK_OFFSET_X + col * (BLOCK_WIDTH + BLOCK_PADDING)
            y = BLOCK_OFFSET_Y + row * (BLOCK_HEIGHT + BLOCK_PADDING)
            color = BLOCK_COLORS[row % len(BLOCK_COLORS)]
            blocks.append(pygame.Rect(x, y, BLOCK_WIDTH, BLOCK_HEIGHT))
            blocks[-1].color = color
    return blocks


def check_ball_block(ball, blocks):
    ball_rect = pygame.Rect(
        ball.x - BALL_RADIUS, ball.y - BALL_RADIUS,
        BALL_RADIUS * 2, BALL_RADIUS * 2
    )
    hit_index = ball_rect.collidelist(blocks)
    if hit_index == -1:
        return blocks, 0

    block = blocks[hit_index]
    bx = ball.x - block.centerx
    by = ball.y - block.centery

    if abs(bx) / block.width > abs(by) / block.height:
        ball.vx *= -1
    else:
        ball.vy *= -1

    blocks.pop(hit_index)
    return blocks, 10


def draw_text(surface, text, size, x, y, color=WHITE, center=False):
    font = pygame.font.SysFont("consolas", size, bold=True)
    img = font.render(text, True, color)
    rect = img.get_rect()
    if center:
        rect.center = (x, y)
    else:
        rect.topleft = (x, y)
    surface.blit(img, rect)


def main():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("블럭깨기 Breakout")
    clock = pygame.time.Clock()

    paddle = Paddle()
    ball   = Ball()
    blocks = make_blocks()
    score  = 0
    lives  = 3
    state  = "playing"

    while True:
        clock.tick(FPS)
        keys = pygame.key.get_pressed()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    sys.exit()
                if event.key == pygame.K_SPACE:
                    if state == "playing":
                        ball.active = True
                    elif state in ("gameover", "win"):
                        paddle = Paddle()
                        ball   = Ball()
                        blocks = make_blocks()
                        score  = 0
                        lives  = 3
                        state  = "playing"

        if state == "playing":
            paddle.update(keys)
            alive = ball.update(paddle)

            if not alive:
                lives -= 1
                if lives <= 0:
                    state = "gameover"
                else:
                    ball.reset()

            blocks, pts = check_ball_block(ball, blocks)
            score += pts

            if not blocks:
                state = "win"

        # --- draw ---
        screen.fill(BLACK)

        # grid lines
        for x in range(0, WIDTH, 40):
            pygame.draw.line(screen, GRAY, (x, 0), (x, HEIGHT), 1)
        for y in range(0, HEIGHT, 40):
            pygame.draw.line(screen, GRAY, (0, y), (WIDTH, y), 1)

        for block in blocks:
            pygame.draw.rect(screen, block.color, block, border_radius=4)
            pygame.draw.rect(screen, BLACK, block, width=2, border_radius=4)

        paddle.draw(screen)
        ball.draw(screen)

        draw_text(screen, f"SCORE  {score:05d}", 20, 10, 10)
        draw_text(screen, f"LIVES  {'♥ ' * lives}", 20, WIDTH - 180, 10)

        if not ball.active and state == "playing":
            draw_text(screen, "SPACE  키를 눌러 시작", 22,
                      WIDTH // 2, HEIGHT // 2 + 80, YELLOW, center=True)

        if state == "gameover":
            draw_text(screen, "GAME OVER", 60, WIDTH // 2, HEIGHT // 2 - 30,
                      RED, center=True)
            draw_text(screen, f"최종 점수: {score}", 28, WIDTH // 2, HEIGHT // 2 + 40,
                      WHITE, center=True)
            draw_text(screen, "SPACE — 다시 시작  /  ESC — 종료", 20,
                      WIDTH // 2, HEIGHT // 2 + 90, GRAY, center=True)

        if state == "win":
            draw_text(screen, "YOU WIN!", 60, WIDTH // 2, HEIGHT // 2 - 30,
                      GREEN, center=True)
            draw_text(screen, f"최종 점수: {score}", 28, WIDTH // 2, HEIGHT // 2 + 40,
                      WHITE, center=True)
            draw_text(screen, "SPACE — 다시 시작  /  ESC — 종료", 20,
                      WIDTH // 2, HEIGHT // 2 + 90, GRAY, center=True)

        pygame.display.flip()


if __name__ == "__main__":
    main()
