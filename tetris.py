import pygame
import random
from enum import Enum
from collections import deque

# 초기화
pygame.init()

# 상수
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
GRID_WIDTH = 10
GRID_HEIGHT = 20
BLOCK_SIZE = 30
GRID_X = 50
GRID_Y = 50

# 색상
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
CYAN = (0, 255, 255)
MAGENTA = (255, 0, 255)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)

COLORS = [CYAN, BLUE, ORANGE, YELLOW, GREEN, MAGENTA, RED]

# 테트로미노 모양 정의 (회전 포함)
TETROMINOES = {
    'I': [
        [(0, 0), (1, 0), (2, 0), (3, 0)],
        [(0, 0), (0, 1), (0, 2), (0, 3)],
        [(0, 0), (1, 0), (2, 0), (3, 0)],
        [(0, 0), (0, 1), (0, 2), (0, 3)]
    ],
    'O': [
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0, 0), (1, 0), (0, 1), (1, 1)]
    ],
    'T': [
        [(1, 0), (0, 1), (1, 1), (2, 1)],
        [(1, 0), (0, 1), (1, 1), (1, 2)],
        [(0, 1), (1, 1), (2, 1), (1, 2)],
        [(0, 0), (0, 1), (1, 1), (0, 2)]
    ],
    'S': [
        [(1, 0), (2, 0), (0, 1), (1, 1)],
        [(0, 0), (0, 1), (1, 1), (1, 2)],
        [(1, 0), (2, 0), (0, 1), (1, 1)],
        [(0, 0), (0, 1), (1, 1), (1, 2)]
    ],
    'Z': [
        [(0, 0), (1, 0), (1, 1), (2, 1)],
        [(1, 0), (0, 1), (1, 1), (0, 2)],
        [(0, 0), (1, 0), (1, 1), (2, 1)],
        [(1, 0), (0, 1), (1, 1), (0, 2)]
    ],
    'J': [
        [(0, 0), (0, 1), (1, 1), (2, 1)],
        [(1, 0), (2, 0), (1, 1), (1, 2)],
        [(0, 1), (1, 1), (2, 1), (2, 0)],
        [(0, 0), (0, 1), (0, 2), (1, 2)]
    ],
    'L': [
        [(2, 0), (0, 1), (1, 1), (2, 1)],
        [(1, 0), (1, 1), (1, 2), (2, 2)],
        [(0, 1), (1, 1), (2, 1), (0, 0)],
        [(0, 0), (1, 0), (1, 1), (1, 2)]
    ]
}

class Tetris:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption('테트리스')
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 36)
        
        self.grid = [[None for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
        self.current_piece = None
        self.current_x = 0
        self.current_y = 0
        self.current_rotation = 0
        self.current_color = None
        
        self.score = 0
        self.level = 1
        self.lines_cleared = 0
        self.fall_speed = 500  # 밀리초
        self.last_fall_time = 0
        self.game_over = False
        
        self.spawn_piece()
    
    def spawn_piece(self):
        """새로운 블록 생성"""
        piece_type = random.choice(list(TETROMINOES.keys()))
        self.current_piece = piece_type
        self.current_rotation = 0
        self.current_x = GRID_WIDTH // 2 - 1
        self.current_y = 0
        self.current_color = COLORS[list(TETROMINOES.keys()).index(piece_type)]
        
        if not self.is_valid_position(self.current_x, self.current_y, self.current_rotation):
            self.game_over = True
    
    def get_piece_blocks(self, x, y, rotation):
        """현재 블록의 절대 좌표 반환"""
        blocks = TETROMINOES[self.current_piece][rotation]
        return [(x + bx, y + by) for bx, by in blocks]
    
    def is_valid_position(self, x, y, rotation):
        """블록이 유효한 위치에 있는지 확인"""
        blocks = self.get_piece_blocks(x, y, rotation)
        
        for bx, by in blocks:
            if bx < 0 or bx >= GRID_WIDTH or by < 0 or by >= GRID_HEIGHT:
                return False
            if by >= 0 and self.grid[by][bx] is not None:
                return False
        
        return True
    
    def place_piece(self):
        """블록을 그리드에 배치"""
        blocks = self.get_piece_blocks(self.current_x, self.current_y, self.current_rotation)
        
        for bx, by in blocks:
            if 0 <= by < GRID_HEIGHT and 0 <= bx < GRID_WIDTH:
                self.grid[by][bx] = self.current_color
        
        self.clear_lines()
        self.spawn_piece()
    
    def clear_lines(self):
        """완성된 라인 제거"""
        lines_to_clear = []
        
        for y in range(GRID_HEIGHT):
            if all(self.grid[y][x] is not None for x in range(GRID_WIDTH)):
                lines_to_clear.append(y)
        
        for y in sorted(lines_to_clear, reverse=True):
            del self.grid[y]
            self.grid.insert(0, [None for _ in range(GRID_WIDTH)])
        
        if lines_to_clear:
            self.lines_cleared += len(lines_to_clear)
            self.score += len(lines_to_clear) * 100
            if len(lines_to_clear) == 4:
                self.score += 400  # 테트리스 보너스
    
    def move_left(self):
        """왼쪽으로 이동"""
        if self.is_valid_position(self.current_x - 1, self.current_y, self.current_rotation):
            self.current_x -= 1
    
    def move_right(self):
        """오른쪽으로 이동"""
        if self.is_valid_position(self.current_x + 1, self.current_y, self.current_rotation):
            self.current_x += 1
    
    def move_down(self):
        """아래로 이동"""
        if self.is_valid_position(self.current_x, self.current_y + 1, self.current_rotation):
            self.current_y += 1
            return True
        else:
            self.place_piece()
            return False
    
    def rotate(self):
        """회전"""
        new_rotation = (self.current_rotation + 1) % 4
        if self.is_valid_position(self.current_x, self.current_y, new_rotation):
            self.current_rotation = new_rotation
    
    def handle_events(self):
        """이벤트 처리"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    self.move_left()
                elif event.key == pygame.K_RIGHT:
                    self.move_right()
                elif event.key == pygame.K_DOWN:
                    self.move_down()
                elif event.key == pygame.K_UP:
                    self.rotate()
                elif event.key == pygame.K_SPACE:
                    # 하드 드롭
                    while self.move_down():
                        pass
        
        return True
    
    def update(self):
        """게임 상태 업데이트"""
        current_time = pygame.time.get_ticks()
        
        if current_time - self.last_fall_time > self.fall_speed:
            self.move_down()
            self.last_fall_time = current_time
    
    def draw(self):
        """게임 화면 그리기"""
        self.screen.fill(BLACK)
        
        # 그리드 배경
        pygame.draw.rect(self.screen, GRAY, (GRID_X, GRID_Y, GRID_WIDTH * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE), 2)
        
        # 배치된 블록 그리기
        for y in range(GRID_HEIGHT):
            for x in range(GRID_WIDTH):
                if self.grid[y][x] is not None:
                    pygame.draw.rect(
                        self.screen,
                        self.grid[y][x],
                        (GRID_X + x * BLOCK_SIZE, GRID_Y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                    )
                    pygame.draw.rect(
                        self.screen,
                        WHITE,
                        (GRID_X + x * BLOCK_SIZE, GRID_Y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE),
                        1
                    )
        
        # 현재 블록 그리기
        if self.current_piece:
            blocks = self.get_piece_blocks(self.current_x, self.current_y, self.current_rotation)
            for bx, by in blocks:
                if by >= 0:
                    pygame.draw.rect(
                        self.screen,
                        self.current_color,
                        (GRID_X + bx * BLOCK_SIZE, GRID_Y + by * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                    )
                    pygame.draw.rect(
                        self.screen,
                        WHITE,
                        (GRID_X + bx * BLOCK_SIZE, GRID_Y + by * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE),
                        1
                    )
        
        # 정보 표시
        info_x = GRID_X + GRID_WIDTH * BLOCK_SIZE + 20
        score_text = self.font.render(f'점수: {self.score}', True, WHITE)
        level_text = self.font.render(f'레벨: {self.level}', True, WHITE)
        lines_text = self.font.render(f'라인: {self.lines_cleared}', True, WHITE)
        
        self.screen.blit(score_text, (info_x, 60))
        self.screen.blit(level_text, (info_x, 120))
        self.screen.blit(lines_text, (info_x, 180))
        
        if self.game_over:
            game_over_text = self.font.render('게임 오버!', True, RED)
            self.screen.blit(game_over_text, (GRID_X + 20, GRID_Y + GRID_HEIGHT * BLOCK_SIZE // 2 - 20))
        
        pygame.display.flip()
    
    def run(self):
        """게임 루프"""
        running = True
        
        while running:
            running = self.handle_events()
            
            if not self.game_over:
                self.update()
            
            self.draw()
            self.clock.tick(60)
        
        pygame.quit()

if __name__ == '__main__':
    game = Tetris()
    game.run()
